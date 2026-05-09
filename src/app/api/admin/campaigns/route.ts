import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  utmSource: z.string().min(1).max(100),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(150).optional().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
  spendUsd: z.number().min(0).max(1_000_000),
  channel: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: "Unauthorized" as const, status: 401 as const }
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return { error: "Forbidden" as const, status: 403 as const }
  }
  return { userId }
}

/**
 * POST /api/admin/campaigns — log weekly marketing spend.
 *
 * No idempotency — admins can post multiple rows for the same period
 * (e.g. revising an estimate). The CampaignSpend table is append-only;
 * use the GET on the page side to surface duplicates if they appear.
 */
export async function POST(req: Request) {
  const a = await requireAdmin()
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const periodStart = new Date(parsed.data.periodStart)
  const periodEnd = new Date(parsed.data.periodEnd)
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return NextResponse.json({ error: "invalid_dates" }, { status: 400 })
  }
  if (periodEnd < periodStart) {
    return NextResponse.json({ error: "period_end_before_start" }, { status: 400 })
  }

  const row = await db.campaignSpend.create({
    data: {
      utmSource: parsed.data.utmSource.toLowerCase(),
      utmMedium: parsed.data.utmMedium?.toLowerCase() ?? null,
      utmCampaign: parsed.data.utmCampaign?.toLowerCase() ?? null,
      periodStart,
      periodEnd,
      spendCents: Math.round(parsed.data.spendUsd * 100),
      channel: parsed.data.channel ?? null,
      notes: parsed.data.notes ?? null,
      enteredById: a.userId,
    },
  })

  return NextResponse.json({ ok: true, id: row.id })
}

/**
 * GET /api/admin/campaigns — list all spend rows (most recent first).
 * Used by /admin/campaigns AND any future export tooling.
 */
export async function GET() {
  const a = await requireAdmin()
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status })

  const rows = await db.campaignSpend.findMany({
    orderBy: [{ periodEnd: "desc" }],
    take: 500,
  })

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      utmSource: r.utmSource,
      utmMedium: r.utmMedium,
      utmCampaign: r.utmCampaign,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      spendUsd: r.spendCents / 100,
      channel: r.channel,
      notes: r.notes,
    })),
  })
}
