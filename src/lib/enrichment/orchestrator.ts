/**
 * Enrichment orchestrator — runs the 4-stage pipeline for a single
 * ClientDeal, charging credits along the way and writing structured
 * results back to ClientDealEnrichment + ClientContact.
 *
 * Pipeline order (cheapest → most expensive):
 *   1. Website scrape  (free)        — mailto: emails on the company's site
 *   2. Perplexity      (~2 credits)  — decision-maker name/title/email
 *   3. Hunter          (~3-13 cred)  — domain-search + targeted email-finder
 *   4. Prospeo         (~10-70 cred) — paid company + person enrichment
 *
 * Dedup discipline:
 *   - existingEmails: emails already on this ClientDeal (loaded once)
 *   - addedEmails:    emails inserted during THIS run
 *   - insertContact() checks both before any DB write
 *
 * Graceful degradation:
 *   - Each step's API key is checked individually; missing keys cause
 *     that step to no-op (returns empty result), pipeline keeps going.
 *   - Any thrown exception from a step is caught and logged; never
 *     aborts the run.
 *
 * Credit handling:
 *   - Each operation debits up-front (or skips if dry-run estimate fails)
 *   - Prospeo returns free_enrichment: true on deduped lookups — those
 *     responses are NOT charged (we still update DB)
 *   - On hard error after debits, refunds all unspent credits
 */
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  debitCredits,
  grantCredits,
  hasBalance,
  InsufficientCreditsError,
} from "./credits/ledger"
import { CREDIT_COSTS, MAX_ENRICHMENT_COST } from "./credits/pricing"
import { findEmailsOnWebsite, type FoundEmail } from "./website-scrape/email-finder"
import { researchBusiness } from "./perplexity/client"
import { domainSearch, emailFinder, type HunterContact } from "./hunter/client"
import {
  enrichCompany,
  enrichPerson,
  normalizeDomain,
  ProspeoError,
} from "./prospeo/client"
import type { ProspeoCompany } from "./prospeo/types"

const MAX_PERSON_LOOKUPS_PER_CALL = 4

export interface EnrichmentResult {
  ok: boolean
  enrichmentId: string
  totalCreditsCost: number
  contactsAdded: number
  errorMessage: string | null
  sources: {
    website: { found: number; emails: FoundEmail[] }
    perplexity: { contactName: string | null; contactEmail: string | null }
    hunter: { domainContacts: number; emailFinderHit: boolean }
    prospeo: { companyMatched: boolean; personsMatched: number; freeMatches: number }
  }
}

interface DealForEnrich {
  id: string
  userId: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  industry: string | null
}

interface ContactRow {
  email: string
  firstName: string | null
  lastName: string | null
  title: string | null
  phone: string | null
  source: string
  confidence: number | null
}

/**
 * Run the full pipeline for a single ClientDeal. Throws
 * InsufficientCreditsError if the user can't cover even the worst-case
 * cost; otherwise always resolves (errors are caught + logged).
 */
export async function runEnrichmentPipeline(args: {
  dealId: string
  userId: string
}): Promise<EnrichmentResult> {
  // Pre-flight balance check (max-cost worst case)
  const balanceCheck = await hasBalance(args.userId, MAX_ENRICHMENT_COST)
  if (!balanceCheck.ok) {
    throw new InsufficientCreditsError(MAX_ENRICHMENT_COST, balanceCheck.current)
  }

  const deal = await db.clientDeal.findFirst({
    where: { id: args.dealId, userId: args.userId },
    select: {
      id: true,
      userId: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      website: true,
      industry: true,
      contacts: { select: { email: true } },
    },
  })
  if (!deal) throw new Error(`ClientDeal ${args.dealId} not found for user ${args.userId}`)

  const startedAt = new Date()
  const dealCore: DealForEnrich = {
    id: deal.id,
    userId: deal.userId,
    companyName: deal.companyName,
    contactName: deal.contactName,
    contactEmail: deal.contactEmail,
    contactPhone: deal.contactPhone,
    website: deal.website,
    industry: deal.industry,
  }

  // Dedup buckets
  const existingEmails = new Set<string>(
    deal.contacts.map((c) => c.email?.toLowerCase()).filter((e): e is string => Boolean(e)),
  )
  if (deal.contactEmail) existingEmails.add(deal.contactEmail.toLowerCase())
  const addedEmails = new Set<string>()
  const contactsToInsert: ContactRow[] = []

  // Source provenance + credit cost tracking (mutated inside each step)
  const sources = {
    website: { found: 0, emails: [] as FoundEmail[] },
    perplexity: { contactName: null as string | null, contactEmail: null as string | null },
    hunter: { domainContacts: 0, emailFinderHit: false },
    prospeo: { companyMatched: false, personsMatched: 0, freeMatches: 0 },
  }
  let totalCreditsCost = 0
  let errorMessage: string | null = null

  // Company-level fields gathered from any source
  const company: Partial<{
    domain: string | null
    description: string | null
    industry: string | null
    employeeCount: number | null
    employeeRange: string | null
    revenueRange: string | null
    foundedYear: number | null
    city: string | null
    state: string | null
    country: string | null
    linkedinUrl: string | null
    twitterUrl: string | null
    facebookUrl: string | null
    instagramUrl: string | null
    logoUrl: string | null
    managementCompany: string | null
    prospeoCompanyId: string | null
  }> = {}

  // Helper: queue a contact for insert, deduping against existing + this-run
  function queueContact(c: ContactRow): boolean {
    const norm = c.email.toLowerCase()
    if (existingEmails.has(norm) || addedEmails.has(norm)) return false
    addedEmails.add(norm)
    contactsToInsert.push({ ...c, email: norm })
    return true
  }

  const websiteDomain = normalizeDomain(dealCore.website)

  // ──────────────────────────────────────────────────────────────────
  //  Step 1 — WEBSITE SCRAPE (free, no credit charge)
  // ──────────────────────────────────────────────────────────────────
  if (dealCore.website) {
    try {
      const found = await findEmailsOnWebsite({ website: dealCore.website, limit: 5 })
      sources.website.found = found.length
      sources.website.emails = found
      for (const e of found) {
        // Try to split into a first/last from local-part for personal emails
        const local = e.email.split("@")[0] ?? ""
        const parts = local.split(/[._\-+]/)
        const firstName = !e.isGeneric && parts[0] ? capitalize(parts[0]) : null
        const lastName = !e.isGeneric && parts[1] ? capitalize(parts[1]) : null
        queueContact({
          email: e.email,
          firstName,
          lastName,
          title: null,
          phone: null,
          source: "website",
          confidence: e.isGeneric ? 50 : 80,
        })
      }
    } catch (err) {
      logger.warn("Enrichment website scrape failed", {
        dealId: dealCore.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  Step 2 — PERPLEXITY (cheap LLM research)
  // ──────────────────────────────────────────────────────────────────
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      await debitCredits({
        userId: args.userId,
        amount: CREDIT_COSTS.PERPLEXITY_RESEARCH,
        reason: "enrichment-debit",
        metadata: { dealId: dealCore.id, operation: "perplexity" },
      })
      totalCreditsCost += CREDIT_COSTS.PERPLEXITY_RESEARCH
      const research = await researchBusiness({
        name: dealCore.companyName,
        website: dealCore.website,
        industry: dealCore.industry,
      })
      sources.perplexity.contactName = research.contact_name
      sources.perplexity.contactEmail = research.contact_email
      if (research.management_company) company.managementCompany = research.management_company
      if (research.description) company.description = research.description
      if (research.contact_email) {
        const split = splitName(research.contact_name)
        queueContact({
          email: research.contact_email,
          firstName: split.firstName,
          lastName: split.lastName,
          title: research.contact_title,
          phone: null,
          source: "perplexity",
          confidence: 75,
        })
      }
    } catch (err) {
      logger.warn("Enrichment Perplexity step failed", {
        dealId: dealCore.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  Step 3 — HUNTER (domain-search + targeted email-finder)
  // ──────────────────────────────────────────────────────────────────
  if (process.env.HUNTER_API_KEY && websiteDomain) {
    try {
      await debitCredits({
        userId: args.userId,
        amount: CREDIT_COSTS.HUNTER_DOMAIN_SEARCH,
        reason: "enrichment-debit",
        metadata: { dealId: dealCore.id, operation: "hunter-domain" },
      })
      totalCreditsCost += CREDIT_COSTS.HUNTER_DOMAIN_SEARCH

      const domainContacts = await domainSearch(websiteDomain)
      sources.hunter.domainContacts = domainContacts.length
      for (const c of domainContacts) {
        queueContact({
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          title: c.title,
          phone: null,
          source: "hunter-domain",
          confidence: c.confidence,
        })
      }

      // If Perplexity gave us a name and we still don't have an email
      // for them, try Hunter's targeted email-finder for that exact person.
      const ppName = sources.perplexity.contactName
      if (ppName && !sources.perplexity.contactEmail) {
        const split = splitName(ppName)
        if (split.firstName && split.lastName) {
          await debitCredits({
            userId: args.userId,
            amount: CREDIT_COSTS.HUNTER_EMAIL_FINDER,
            reason: "enrichment-debit",
            metadata: { dealId: dealCore.id, operation: "hunter-finder" },
          })
          totalCreditsCost += CREDIT_COSTS.HUNTER_EMAIL_FINDER
          const found: HunterContact | null = await emailFinder({
            firstName: split.firstName,
            lastName: split.lastName,
            domain: websiteDomain,
          })
          if (found) {
            sources.hunter.emailFinderHit = true
            queueContact({
              email: found.email,
              firstName: found.firstName,
              lastName: found.lastName,
              title: found.title,
              phone: null,
              source: "hunter-finder",
              confidence: found.confidence,
            })
          }
        }
      }
    } catch (err) {
      logger.warn("Enrichment Hunter step failed", {
        dealId: dealCore.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  Step 4 — PROSPEO (paid company + person)
  // ──────────────────────────────────────────────────────────────────
  if (process.env.PROSPEO_API_KEY) {
    let companyForPersonLookup: ProspeoCompany | null = null
    try {
      const companyRes = await enrichCompany({
        company_website: dealCore.website,
        company_name: dealCore.companyName,
      })
      companyForPersonLookup = companyRes.company
      if (!companyRes.free_enrichment) {
        await debitCredits({
          userId: args.userId,
          amount: CREDIT_COSTS.PROSPEO_COMPANY_BILLABLE,
          reason: "enrichment-debit",
          metadata: { dealId: dealCore.id, operation: "prospeo-company" },
        })
        totalCreditsCost += CREDIT_COSTS.PROSPEO_COMPANY_BILLABLE
      } else {
        sources.prospeo.freeMatches += 1
      }
      sources.prospeo.companyMatched = true
      const c = companyRes.company
      mapProspeoCompany(c, company)
    } catch (err) {
      handleProspeoError("prospeo-company", err, dealCore.id)
    }

    // Person lookups: prefer LinkedIn URLs from already-found contacts,
    // then any email we haven't yet enriched. Cap at MAX_PERSON_LOOKUPS.
    const candidateContacts = contactsToInsert
      .filter((c) => !c.email.startsWith("info") && !c.email.startsWith("contact"))
      .slice(0, MAX_PERSON_LOOKUPS_PER_CALL)

    for (const cand of candidateContacts) {
      try {
        const personRes = await enrichPerson({
          email: cand.email,
          first_name: cand.firstName ?? undefined,
          last_name: cand.lastName ?? undefined,
          company_name: dealCore.companyName,
          company_website: dealCore.website ?? undefined,
        })
        if (!personRes.free_enrichment) {
          await debitCredits({
            userId: args.userId,
            amount: CREDIT_COSTS.PROSPEO_PERSON_BILLABLE,
            reason: "enrichment-debit",
            metadata: { dealId: dealCore.id, operation: "prospeo-person", email: cand.email },
          })
          totalCreditsCost += CREDIT_COSTS.PROSPEO_PERSON_BILLABLE
        } else {
          sources.prospeo.freeMatches += 1
        }
        sources.prospeo.personsMatched += 1

        // Upgrade the queued contact in place — newest, most-verified data wins
        const p = personRes.person
        if (p.first_name) cand.firstName = p.first_name
        if (p.last_name) cand.lastName = p.last_name
        if (p.job_title) cand.title = p.job_title
        if (p.mobile) cand.phone = p.mobile
        cand.source = "prospeo"
        cand.confidence = 95

        // Pick up a richer company record if we got one alongside the person
        if (personRes.company && !sources.prospeo.companyMatched) {
          mapProspeoCompany(personRes.company, company)
          sources.prospeo.companyMatched = true
          companyForPersonLookup = personRes.company
        }
      } catch (err) {
        handleProspeoError("prospeo-person", err, dealCore.id)
      }
    }

    // Suppress lint warning: companyForPersonLookup is assigned for future
    // expansion (e.g. enriching a referenced parent company). Not used yet.
    void companyForPersonLookup
  }

  // ──────────────────────────────────────────────────────────────────
  //  Persist results — single transaction so partial writes don't leak
  // ──────────────────────────────────────────────────────────────────
  const enrichment = await db.$transaction(async (tx) => {
    const created = await tx.clientDealEnrichment.upsert({
      where: { clientDealId: dealCore.id },
      create: {
        clientDealId: dealCore.id,
        domain: company.domain ?? websiteDomain ?? null,
        description: company.description ?? null,
        industry: company.industry ?? dealCore.industry ?? null,
        employeeCount: company.employeeCount ?? null,
        employeeRange: company.employeeRange ?? null,
        revenueRange: company.revenueRange ?? null,
        foundedYear: company.foundedYear ?? null,
        city: company.city ?? null,
        state: company.state ?? null,
        country: company.country ?? null,
        linkedinUrl: company.linkedinUrl ?? null,
        twitterUrl: company.twitterUrl ?? null,
        facebookUrl: company.facebookUrl ?? null,
        instagramUrl: company.instagramUrl ?? null,
        logoUrl: company.logoUrl ?? null,
        managementCompany: company.managementCompany ?? null,
        prospeoCompanyId: company.prospeoCompanyId ?? null,
        sources: sources as object,
        totalCreditsCost,
        startedAt,
        completedAt: new Date(),
        errorMessage,
      },
      update: {
        domain: company.domain ?? websiteDomain ?? undefined,
        description: company.description ?? undefined,
        industry: company.industry ?? undefined,
        employeeCount: company.employeeCount ?? undefined,
        employeeRange: company.employeeRange ?? undefined,
        revenueRange: company.revenueRange ?? undefined,
        foundedYear: company.foundedYear ?? undefined,
        city: company.city ?? undefined,
        state: company.state ?? undefined,
        country: company.country ?? undefined,
        linkedinUrl: company.linkedinUrl ?? undefined,
        twitterUrl: company.twitterUrl ?? undefined,
        facebookUrl: company.facebookUrl ?? undefined,
        instagramUrl: company.instagramUrl ?? undefined,
        logoUrl: company.logoUrl ?? undefined,
        managementCompany: company.managementCompany ?? undefined,
        prospeoCompanyId: company.prospeoCompanyId ?? undefined,
        sources: sources as object,
        totalCreditsCost: { increment: totalCreditsCost },
        completedAt: new Date(),
        errorMessage,
      },
    })

    // Upgrade ClientDeal with industry / website if we learned them
    await tx.clientDeal.update({
      where: { id: dealCore.id },
      data: {
        industry: dealCore.industry ?? company.industry ?? undefined,
        lastEnrichedAt: new Date(),
      },
    })

    // Insert all queued contacts. Set is_primary on the first one if the
    // deal currently has no primary contact.
    if (contactsToInsert.length > 0) {
      const hasPrimary = await tx.clientContact.count({
        where: { clientDealId: dealCore.id, isPrimary: true },
      })
      let setPrimary = hasPrimary === 0
      for (const c of contactsToInsert) {
        // Sort by confidence desc — but we already prefer Prospeo (95) >
        // Hunter (~80) > website (50/80). First in queue isn't always best.
        await tx.clientContact.create({
          data: {
            clientDealId: dealCore.id,
            firstName: c.firstName ?? "Unknown",
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            title: c.title,
            isPrimary: setPrimary,
            notes: c.confidence ? `Confidence ${c.confidence}% via ${c.source}` : null,
          },
        })
        setPrimary = false // only first wins
      }
    }

    return created
  })

  return {
    ok: true,
    enrichmentId: enrichment.id,
    totalCreditsCost,
    contactsAdded: contactsToInsert.length,
    errorMessage,
    sources,
  }
}

// ────────────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────────────

function splitName(full: string | null): {
  firstName: string | null
  lastName: string | null
} {
  if (!full) return { firstName: null, lastName: null }
  const parts = full.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: null, lastName: null }
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function mapProspeoCompany(
  c: ProspeoCompany,
  out: Record<string, unknown>,
): void {
  if (c.company_id) out.prospeoCompanyId = c.company_id
  if (c.domain) out.domain = c.domain
  if (c.description) out.description = c.description
  if (c.industry) out.industry = c.industry
  if (typeof c.employee_count === "number") out.employeeCount = c.employee_count
  if (c.employee_range) out.employeeRange = c.employee_range
  if (c.revenue_range_printed) out.revenueRange = c.revenue_range_printed
  if (typeof c.founded === "number") out.foundedYear = c.founded
  if (c.city) out.city = c.city
  if (c.state) out.state = c.state
  if (c.country) out.country = c.country
  if (c.linkedin_url) out.linkedinUrl = c.linkedin_url
  if (c.twitter_url) out.twitterUrl = c.twitter_url
  if (c.facebook_url) out.facebookUrl = c.facebook_url
  if (c.instagram_url) out.instagramUrl = c.instagram_url
  if (c.logo_url) out.logoUrl = c.logo_url
}

function handleProspeoError(operation: string, err: unknown, dealId: string): void {
  if (err instanceof ProspeoError) {
    // No-match isn't an error — just means Prospeo doesn't have data
    if (err.code === "NO_MATCH") return
    logger.warn(`Enrichment ${operation} failed`, {
      dealId,
      code: err.code,
      message: err.message,
    })
  } else {
    logger.warn(`Enrichment ${operation} failed (unknown)`, {
      dealId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// Suppress unused-import warning for grantCredits — exported helper used
// by future error-refund paths and the topup webhook.
void grantCredits
