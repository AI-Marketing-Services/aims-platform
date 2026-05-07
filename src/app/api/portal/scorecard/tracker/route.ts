import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * GET /api/portal/scorecard/tracker
 *
 * Pivots ClientDeals onto a single row per prospect for the bottom
 * "Prospecting Activity Tracker" table. Returns recently-touched deals
 * (last 60 days OR un-archived prospect/discovery deals) so the operator
 * sees their active book of work without polluting the table with
 * historical closed-won / lost rows.
 */
export async function GET(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const limitParam = Number(url.searchParams.get("limit") ?? 100)
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 100

  try {
    const rows = await db.clientDeal.findMany({
      where: {
        userId,
        // Active prospecting book — any deal that's still in early stages
        // OR has been touched recently. Closed deals stay out of the table.
        OR: [
          { stage: { in: ["PROSPECT", "DISCOVERY_CALL", "PROPOSAL_SENT"] } },
          {
            updatedAt: {
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            },
          },
        ],
        wonAt: null,
        lostAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactRole: true,
        relationship: true,
        possibleProblem: true,
        outreachType: true,
        messageStatus: true,
        firstMessageAt: true,
        followUp1At: true,
        followUp2At: true,
        discoveryAskAt: true,
        nextAction: true,
        nextActionDueAt: true,
        notes: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ rows })
  } catch (err) {
    logger.error("Failed to load prospecting tracker", err, {
      endpoint: "GET /api/portal/scorecard/tracker",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

const trackerPatchSchema = z.object({
  id: z.string().min(1).max(64),
  companyName: z.string().max(200).optional(),
  contactName: z.string().max(200).nullable().optional(),
  contactRole: z.string().max(120).nullable().optional(),
  relationship: z.string().max(200).nullable().optional(),
  possibleProblem: z.string().max(2000).nullable().optional(),
  outreachType: z.string().max(60).nullable().optional(),
  messageStatus: z.string().max(60).nullable().optional(),
  firstMessageAt: z.string().datetime().nullable().optional(),
  followUp1At: z.string().datetime().nullable().optional(),
  followUp2At: z.string().datetime().nullable().optional(),
  discoveryAskAt: z.string().datetime().nullable().optional(),
  nextAction: z.string().max(2000).nullable().optional(),
  nextActionDueAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(10_000).nullable().optional(),
})

/**
 * PATCH /api/portal/scorecard/tracker — inline-edit any tracker column.
 * Validates ownership before updating.
 */
export async function PATCH(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = trackerPatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const owns = await db.clientDeal.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  })
  if (!owns)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  const { id, ...rest } = parsed.data
  // Convert datetime strings → Date or null. Skip undefined keys so
  // the operator only nukes a value when they explicitly clear it.
  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue
    if (
      [
        "firstMessageAt",
        "followUp1At",
        "followUp2At",
        "discoveryAskAt",
        "nextActionDueAt",
      ].includes(key)
    ) {
      update[key] = value === null ? null : new Date(value as string)
    } else {
      update[key] = value
    }
  }

  try {
    await db.clientDeal.update({ where: { id }, data: update })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to update tracker row", err, {
      endpoint: "PATCH /api/portal/scorecard/tracker",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

const createSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(200).nullable().optional(),
  contactRole: z.string().max(120).nullable().optional(),
  relationship: z.string().max(200).nullable().optional(),
  possibleProblem: z.string().max(2000).nullable().optional(),
})

/**
 * POST /api/portal/scorecard/tracker — add a new prospect row directly
 * from the tracker. Drops them at PROSPECT stage with whatever metadata
 * the operator provided; they fill the rest in inline.
 */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const deal = await db.clientDeal.create({
      data: {
        userId,
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName ?? null,
        contactRole: parsed.data.contactRole ?? null,
        relationship: parsed.data.relationship ?? null,
        possibleProblem: parsed.data.possibleProblem ?? null,
        source: "scorecard",
        stage: "PROSPECT",
        activities: {
          create: {
            type: "STAGE_CHANGE",
            description: "Created from prospecting tracker",
          },
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ id: deal.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create tracker row", err, {
      endpoint: "POST /api/portal/scorecard/tracker",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
