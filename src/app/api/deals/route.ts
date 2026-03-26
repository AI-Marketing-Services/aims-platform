import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { getDeals, createDeal, getDealsByStage } from "@/lib/db/queries"
import { notifyNewLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { db } from "@/lib/db"
import { scoreLeadFromSignals } from "@/lib/scoring/lead-scorer"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

const createDealSchema = z.object({
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  channelTag: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  value: z.number().optional(),
})

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const view = searchParams.get("view")

  if (view === "pipeline") {
    const pipeline = await getDealsByStage()
    return NextResponse.json(pipeline)
  }

  const deals = await getDeals({
    stage: (searchParams.get("stage") as import("@prisma/client").DealStage) ?? undefined,
    assignedTo: searchParams.get("assignedTo") ?? undefined,
    channelTag: searchParams.get("channelTag") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
    offset: parseInt(searchParams.get("offset") ?? "0"),
  })

  return NextResponse.json(deals)
}

export async function POST(req: Request) {
  if (formRatelimit) {
    const ip = getIp(req)
    const { success } = await formRatelimit.limit(`deals:${ip}`)
    if (!success) return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = createDealSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const scored = scoreLeadFromSignals({
      source: parsed.data.source ?? "direct",
      industry: parsed.data.industry,
      isVendingpreneur: parsed.data.channelTag === "vendingpreneurs" || parsed.data.source?.includes("vending"),
    })

    const deal = await createDeal({
      ...parsed.data,
      leadScore: scored.score,
      leadScoreTier: scored.tier,
      leadScoreReason: scored.reason,
      priority: scored.priority,
    })

    // Notify team
    await notifyNewLead({
      contactName: deal.contactName,
      contactEmail: deal.contactEmail,
      company: deal.company ?? undefined,
      source: deal.source ?? undefined,
      channelTag: deal.channelTag ?? undefined,
    }).catch((err) => logger.error("Operation failed", err))

    // Sync to Close CRM (fire-and-forget)
    createCloseLead({
      contactName: deal.contactName,
      contactEmail: deal.contactEmail,
      company: deal.company,
      phone: deal.phone,
      website: deal.website,
      source: deal.source,
      dealId: deal.id,
    }).then((closeLeadId) => {
      if (closeLeadId) {
        db.deal.update({ where: { id: deal.id }, data: { closeLeadId } }).catch((err) => logger.error("Operation failed", err))
      }
    }).catch((err) => logger.error("Operation failed", err))

    return NextResponse.json(deal, { status: 201 })
  } catch (err) {
    logger.error("Failed to create deal:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
