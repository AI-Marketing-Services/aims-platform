import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { getDeals, createDeal, getDealsByStage } from "@/lib/db/queries"
import { notifyNewLead } from "@/lib/notifications"

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
  try {
    const body = await req.json()
    const parsed = createDealSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const deal = await createDeal(parsed.data)

    // Notify team of new lead
    await notifyNewLead({
      contactName: deal.contactName,
      contactEmail: deal.contactEmail,
      company: deal.company ?? undefined,
      source: deal.source ?? undefined,
      channelTag: deal.channelTag ?? undefined,
    }).catch(console.error)

    return NextResponse.json(deal, { status: 201 })
  } catch (err) {
    console.error("Failed to create deal:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
