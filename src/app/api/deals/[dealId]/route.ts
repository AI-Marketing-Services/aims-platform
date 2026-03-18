import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { getDealById, updateDealStage } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { updateCloseLeadStatus } from "@/lib/close"

const updateDealSchema = z.object({
  stage: z.enum([
    "NEW_LEAD", "QUALIFIED", "DEMO_BOOKED", "PROPOSAL_SENT",
    "NEGOTIATION", "ACTIVE_CLIENT", "UPSELL_OPPORTUNITY",
    "AT_RISK", "CHURNED", "LOST",
  ]).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  value: z.number().optional(),
  mrr: z.number().optional(),
  assignedTo: z.string().optional(),
  lostReason: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  try {
    const deal = await getDealById(dealId)
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(deal)
  } catch (err) {
    console.error(`Failed to fetch deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  const body = await req.json()
  const parsed = updateDealSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { stage, ...rest } = parsed.data

    // If stage change, use the helper that logs activity
    if (stage) {
      const deal = await updateDealStage(dealId, stage, userId)
      if (Object.keys(rest).length > 0) {
        await db.deal.update({ where: { id: dealId }, data: rest })
      }
      // Sync stage to Close CRM (fire-and-forget)
      if (deal.closeLeadId) {
        updateCloseLeadStatus(deal.closeLeadId, stage).catch((err) =>
          console.error(`Failed to sync deal ${dealId} stage to Close CRM:`, err)
        )
      }
      return NextResponse.json(deal)
    }

    const deal = await db.deal.update({
      where: { id: dealId },
      data: rest,
    })

    return NextResponse.json(deal)
  } catch (err) {
    console.error(`Failed to update deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  try {
    await db.deal.delete({ where: { id: dealId } })
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error(`Failed to delete deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
