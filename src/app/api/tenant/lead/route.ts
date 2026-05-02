import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp, rateLimitedResponse } from "@/lib/ratelimit"
import { notifyNewLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { getValidatedAttributionResellerId } from "@/lib/tenant/attribution"
import { logger } from "@/lib/logger"

const schema = z.object({
  resellerId: z.string().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  subdomain: z.string().trim().max(80).optional(),
  customDomain: z.string().trim().max(253).optional(),
})

/**
 * POST /api/tenant/lead
 *
 * Public endpoint called by the inline form on a whitelabel tenant page.
 * Creates a Deal tagged with `referringResellerId` so the reseller gets
 * credit / commission attribution for the lead they drove.
 *
 * The `resellerId` in the body is validated server-side — if it doesn't
 * match a real RESELLER/ADMIN user with a published site, we still
 * capture the lead (untagged) instead of dropping it, so a bad client
 * payload never costs us a lead.
 */
export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) return rateLimitedResponse(req, "POST /api/tenant/lead")
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }
  const input = parsed.data

  // Validate the reseller claim. Requires: user exists, role is reseller-ish,
  // owns a published OperatorSite, AND the request actually originated from
  // that reseller's whitelabel domain. Without the Origin/Host check, anyone
  // could POST `resellerId: "<their-own-id>"` from a competing site and
  // harvest leads that didn't actually come through their funnel — fraudulent
  // commission. Cookie fallback covers the legitimate case where the visitor
  // navigated via reseller link and the cookie is set.
  let validReferringResellerId: string | null = null
  try {
    const reseller = await db.user.findUnique({
      where: { id: input.resellerId },
      select: {
        id: true,
        role: true,
        operatorSite: {
          select: { isPublished: true, subdomain: true, customDomain: true },
        },
      },
    })
    const isEligibleRole =
      reseller?.role === "RESELLER" ||
      reseller?.role === "ADMIN" ||
      reseller?.role === "SUPER_ADMIN"

    if (reseller && isEligibleRole && reseller.operatorSite?.isPublished) {
      // Origin / Host validation. Compare the request origin to the
      // reseller's published domain(s) — subdomain on aioperatorcollective.com
      // OR custom domain. Reject if mismatched.
      const requestHost =
        req.headers.get("origin")?.replace(/^https?:\/\//, "").split("/")[0] ??
        req.headers.get("x-forwarded-host") ??
        req.headers.get("host") ??
        ""

      const expectedSub = reseller.operatorSite.subdomain
        ? `${reseller.operatorSite.subdomain}.aioperatorcollective.com`
        : null
      const expectedCustom = reseller.operatorSite.customDomain ?? null

      const originMatches =
        (expectedSub && requestHost.toLowerCase() === expectedSub.toLowerCase()) ||
        (expectedCustom && requestHost.toLowerCase() === expectedCustom.toLowerCase()) ||
        // Allow our own apex/www in case admin is testing the form locally
        // or from the canonical site — these are first-party hosts.
        requestHost.toLowerCase() === "aioperatorcollective.com" ||
        requestHost.toLowerCase() === "www.aioperatorcollective.com"

      if (originMatches) {
        validReferringResellerId = reseller.id
      } else {
        logger.warn("Tenant lead: rejected resellerId — origin mismatch", {
          endpoint: "POST /api/tenant/lead",
          claimedResellerId: input.resellerId,
          requestHost,
          expectedSub,
          expectedCustom,
        })
      }
    }
  } catch (err) {
    logger.error("Reseller validation failed; continuing with cookie fallback", err, {
      endpoint: "POST /api/tenant/lead",
    })
  }

  if (!validReferringResellerId) {
    validReferringResellerId = await getValidatedAttributionResellerId(db)
  }

  const company = input.company || undefined
  const phone = input.phone || undefined
  const message = input.message || undefined
  const hostLabel = input.customDomain || (input.subdomain ? `${input.subdomain}.aioperatorcollective.com` : "whitelabel")

  try {
    const deal = await db.deal.create({
      data: {
        contactName: input.name,
        contactEmail: input.email,
        company,
        phone,
        referringResellerId: validReferringResellerId,
        source: "whitelabel-inquiry",
        sourceDetail: `Submitted via ${hostLabel}${message ? ` — Message: ${message}` : ""}`,
        channelTag: validReferringResellerId ? "reseller" : "whitelabel",
        value: 0,
        priority: "MEDIUM",
        stage: "APPLICATION_SUBMITTED",
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `Whitelabel inquiry from ${hostLabel}${message ? `\n\nMessage: ${message}` : ""}`,
          },
        },
      },
    })

    // Notify team (non-blocking)
    notifyNewLead({
      contactName: input.name,
      contactEmail: input.email,
      company,
      source: "whitelabel-inquiry",
      channelTag: validReferringResellerId ? `reseller:${validReferringResellerId}` : "whitelabel",
    }).catch((e) => logger.error("notifyNewLead failed for whitelabel lead", e))

    // Push to Close (non-blocking)
    createCloseLead({
      contactName: input.name,
      contactEmail: input.email,
      company,
      phone,
      source: `whitelabel:${hostLabel}`,
      dealId: deal.id,
    })
      .then((closeLeadId) => {
        if (closeLeadId) {
          db.deal
            .update({ where: { id: deal.id }, data: { closeLeadId } })
            .catch((e) => logger.error("Failed to attach closeLeadId to whitelabel deal", e))
        }
      })
      .catch((e) => logger.error("createCloseLead failed for whitelabel lead", e))

    return NextResponse.json({ ok: true, dealId: deal.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create whitelabel deal", err, {
      endpoint: "POST /api/tenant/lead",
      resellerId: input.resellerId,
    })
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}
