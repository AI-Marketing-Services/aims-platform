import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { runEnrichmentPipeline } from "@/lib/enrichment/orchestrator"
import { InsufficientCreditsError, hasBalance } from "@/lib/enrichment/credits/ledger"
import { MAX_ENRICHMENT_COST } from "@/lib/enrichment/credits/pricing"
import { emitEvent, emitEvents, EVENT_TYPES } from "@/lib/events/emit"
import { ClientDealStage } from "@prisma/client"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 min for bulk import + optional enrich

/**
 * POST /api/portal/crm/import
 *
 * Bulk-creates ClientDeal rows from a parsed CSV. Body shape:
 *   {
 *     rows: Array<{ [csvHeader]: string }>,
 *     mapping: { [csvHeader]: "companyName" | "contactEmail" | ... | "skip" },
 *     defaultStage?: ClientDealStage,         // applied when row has no stage
 *     defaultTags?: string[],                 // appended to every row
 *     enrichOnImport?: boolean,               // run full pipeline on each new deal
 *     dedupBy?: "companyName" | "contactEmail" | "both",
 *   }
 *
 * Dedup: skips rows whose companyName + contactEmail match an existing
 * ClientDeal owned by this operator. Returns counts of created /
 * skipped / failed plus error details so the UI can show an exact
 * "13 imported, 4 duplicates, 1 invalid email" summary.
 *
 * Pre-flight balance check on enrichOnImport mirrors the Scout import
 * pattern: refuses to start if the operator can't afford even the
 * first enrichment (prevents partial-success confusion).
 */

const ALLOWED_STAGES: ClientDealStage[] = [
  "PROSPECT",
  "DISCOVERY_CALL",
  "PROPOSAL_SENT",
  "ACTIVE_RETAINER",
  "COMPLETED",
  "LOST",
]

const importSchema = z.object({
  rows: z.array(z.record(z.string())).min(1).max(2000),
  mapping: z.record(
    z.enum([
      "companyName",
      "contactName",
      "contactEmail",
      "contactPhone",
      "website",
      "industry",
      "value",
      "notes",
      "stage",
      "tags",
      "skip",
    ]),
  ),
  defaultStage: z.string().optional(),
  defaultTags: z.array(z.string()).optional().default([]),
  enrichOnImport: z.boolean().optional().default(false),
  dedupBy: z
    .enum(["companyName", "contactEmail", "both"])
    .optional()
    .default("both"),
})

interface ImportRowResult {
  rowIndex: number
  status: "created" | "skipped-dupe" | "invalid"
  dealId?: string
  reason?: string
}

export async function POST(req: Request) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { rows, mapping, defaultStage, defaultTags, enrichOnImport, dedupBy } =
    parsed.data

  // Pre-flight credit check if enrichOnImport. Refuse to start if the
  // operator can't even afford one enrichment so we don't half-finish.
  if (enrichOnImport) {
    const balance = await hasBalance(dbUserId, MAX_ENRICHMENT_COST)
    if (!balance.ok) {
      return NextResponse.json(
        {
          error: `Auto-enrich needs ${MAX_ENRICHMENT_COST} credits per deal worst case. You have ${balance.current}. Top up or import without auto-enrich.`,
          required: MAX_ENRICHMENT_COST,
          available: balance.current,
        },
        { status: 402 },
      )
    }
  }

  // Build reverse mapping: canonical field -> source header
  const fieldToHeader: Record<string, string> = {}
  for (const [header, field] of Object.entries(mapping)) {
    if (field !== "skip") fieldToHeader[field] = header
  }

  if (!fieldToHeader.companyName) {
    return NextResponse.json(
      { error: "You must map at least one column to 'Company name'." },
      { status: 400 },
    )
  }

  // Pull existing deals once for dedup. Operator only sees their own.
  const existing = await db.clientDeal.findMany({
    where: { userId: dbUserId },
    select: { id: true, companyName: true, contactEmail: true },
  })
  const existingByName = new Map<string, string>()
  const existingByEmail = new Map<string, string>()
  for (const d of existing) {
    existingByName.set(d.companyName.toLowerCase(), d.id)
    if (d.contactEmail) existingByEmail.set(d.contactEmail.toLowerCase(), d.id)
  }

  const results: ImportRowResult[] = []
  const createdDealIds: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const get = (field: string): string => {
      const header = fieldToHeader[field]
      if (!header) return ""
      return row[header]?.trim() ?? ""
    }

    const companyName = get("companyName")
    if (!companyName) {
      results.push({
        rowIndex: i,
        status: "invalid",
        reason: "Missing company name",
      })
      continue
    }

    const contactEmail = normalizeEmail(get("contactEmail"))

    // Dedup
    const dupeId =
      (dedupBy === "companyName" || dedupBy === "both"
        ? existingByName.get(companyName.toLowerCase())
        : null) ??
      (dedupBy === "contactEmail" || dedupBy === "both"
        ? contactEmail
          ? existingByEmail.get(contactEmail)
          : null
        : null)
    if (dupeId) {
      results.push({
        rowIndex: i,
        status: "skipped-dupe",
        dealId: dupeId,
      })
      continue
    }

    // Map fields
    const stageRaw = get("stage")
    const stage =
      ALLOWED_STAGES.includes(stageRaw as ClientDealStage) && stageRaw
        ? (stageRaw as ClientDealStage)
        : ((defaultStage as ClientDealStage | undefined) ?? "PROSPECT")
    const valueNum = parseNumber(get("value"))
    const tags = parseTags(get("tags"), defaultTags)

    try {
      const deal = await db.clientDeal.create({
        data: {
          userId: dbUserId,
          companyName,
          contactName: get("contactName") || null,
          contactEmail: contactEmail || null,
          contactPhone: get("contactPhone") || null,
          website: normaliseWebsite(get("website")) || null,
          industry: get("industry") || null,
          notes: get("notes") || null,
          value: valueNum ?? 0,
          stage,
          tags,
          source: "csv-import",
          activities: {
            create: {
              type: "NOTE",
              description: "Imported from CSV.",
              metadata: { sourceRow: i + 2 }, // +2 for header + 1-indexed
            },
          },
        },
        select: { id: true, companyName: true },
      })
      // Reserve in dedup maps so subsequent identical rows in the SAME
      // file also dedup against the just-created row.
      existingByName.set(companyName.toLowerCase(), deal.id)
      if (contactEmail) existingByEmail.set(contactEmail, deal.id)
      results.push({
        rowIndex: i,
        status: "created",
        dealId: deal.id,
      })
      createdDealIds.push(deal.id)
    } catch (err) {
      logger.warn("CSV import row failed", {
        rowIndex: i,
        companyName,
        error: err instanceof Error ? err.message : String(err),
      })
      results.push({
        rowIndex: i,
        status: "invalid",
        reason: err instanceof Error ? err.message : "Insert failed",
      })
    }
  }

  // Bulk emit DEAL_CREATED events for everything we just made
  if (createdDealIds.length > 0) {
    void emitEvents(
      createdDealIds.slice(0, 200).map((id) => ({
        actorId: dbUserId,
        type: EVENT_TYPES.DEAL_CREATED,
        entityType: "ClientDeal",
        entityId: id,
        metadata: { source: "csv-import" },
      })),
    )
    void emitEvent({
      actorId: dbUserId,
      type: EVENT_TYPES.DEAL_CREATED,
      metadata: {
        source: "csv-import-batch",
        batchSize: createdDealIds.length,
      },
    })
  }

  // Optional inline enrichment, sequential
  let enriched = 0
  let enrichErrors = 0
  let enrichStopped = false
  if (enrichOnImport && createdDealIds.length > 0) {
    for (const dealId of createdDealIds) {
      try {
        await runEnrichmentPipeline({ dealId, userId: dbUserId })
        enriched += 1
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          enrichStopped = true
          break
        }
        enrichErrors += 1
        logger.warn("Bulk-import auto-enrich failed for one deal", {
          dealId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  const created = results.filter((r) => r.status === "created").length
  const dupes = results.filter((r) => r.status === "skipped-dupe").length
  const invalid = results.filter((r) => r.status === "invalid").length

  return NextResponse.json({
    ok: true,
    total: results.length,
    created,
    dupes,
    invalid,
    enriched,
    enrichErrors,
    enrichStopped,
    invalidRows: results
      .filter((r) => r.status === "invalid")
      .slice(0, 50)
      .map((r) => ({ rowIndex: r.rowIndex, reason: r.reason })),
  })
}

function normalizeEmail(raw: string): string {
  if (!raw) return ""
  const t = raw.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : ""
}

function parseNumber(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[$,]/g, "").trim()
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseTags(raw: string, defaults: string[]): string[] {
  const fromRow = raw
    ? raw
        .split(/[,;|]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : []
  return Array.from(new Set([...fromRow, ...defaults]))
}

function normaliseWebsite(raw: string): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
