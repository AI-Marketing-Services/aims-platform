import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import { updateDealSchema } from "@/lib/crm/schemas"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

async function getDealForUser(dealId: string, userId: string) {
  return db.clientDeal.findFirst({
    where: { id: dealId, userId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      activities: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const deal = await getDealForUser(id, dbUserId)
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ deal })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const existing = await db.clientDeal.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = updateDealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { contactEmail, website, tags, value, ...rest } = parsed.data
    const lostReason = (body as { lostReason?: string }).lostReason

    const updates: Record<string, unknown> = { ...rest }
    if (contactEmail !== undefined) updates.contactEmail = contactEmail || null
    if (website !== undefined) updates.website = website || null
    if (tags !== undefined) updates.tags = tags
    if (value !== undefined) updates.value = value

    // Set won/lost timestamps and reason
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      if (parsed.data.stage === "COMPLETED") updates.wonAt = new Date()
      if (parsed.data.stage === "LOST") {
        updates.lostAt = new Date()
        if (lostReason) updates.lostReason = lostReason
      }
      // Clear timestamps if moving back out of terminal states
      if (parsed.data.stage !== "COMPLETED" && existing.stage === "COMPLETED") updates.wonAt = null
      if (parsed.data.stage !== "LOST" && existing.stage === "LOST") { updates.lostAt = null; updates.lostReason = null }
    }

    // Log stage change as activity
    const activities = []
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      activities.push({
        type: "STAGE_CHANGE" as const,
        description: `Stage changed from ${existing.stage} to ${parsed.data.stage}${lostReason ? ` — ${lostReason}` : ""}`,
        metadata: { from: existing.stage, to: parsed.data.stage, ...(lostReason ? { lostReason } : {}) },
      })
    }

    const deal = await db.clientDeal.update({
      where: { id },
      data: {
        ...updates,
        ...(activities.length > 0
          ? { activities: { create: activities } }
          : {}),
      },
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        activities: { orderBy: { createdAt: "desc" } },
      },
    })

    // Universal event log — Today dashboard / digest / activity timeline
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      const eventType =
        parsed.data.stage === "COMPLETED"
          ? EVENT_TYPES.DEAL_WON
          : parsed.data.stage === "LOST"
            ? EVENT_TYPES.DEAL_LOST
            : EVENT_TYPES.DEAL_STAGE_ADVANCED
      void emitEvent({
        actorId: dbUserId,
        type: eventType,
        entityType: "ClientDeal",
        entityId: id,
        metadata: {
          from: existing.stage,
          to: parsed.data.stage,
          dealValue: deal.value,
          companyName: deal.companyName,
          ...(lostReason ? { lostReason } : {}),
        },
      })
    } else {
      void emitEvent({
        actorId: dbUserId,
        type: EVENT_TYPES.DEAL_UPDATED,
        entityType: "ClientDeal",
        entityId: id,
      })
    }

    // Fire notifications on key stage transitions
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      const stageNotifications: Array<{ condition: boolean; type: string; title: string; message: string }> = [
        {
          condition: parsed.data.stage === "ACTIVE_RETAINER",
          type: "onboarding_checklist_ready",
          title: "Client onboarding started",
          message: `${existing.companyName} is now active. Complete the onboarding checklist to start strong.`,
        },
        {
          condition: parsed.data.stage === "COMPLETED",
          type: "deal_won",
          title: "Deal won",
          message: `${existing.companyName} moved to Completed.${existing.value ? ` Worth $${Number(existing.value).toLocaleString()}.` : ""}`,
        },
        {
          condition: parsed.data.stage === "LOST",
          type: "deal_lost",
          title: "Deal lost",
          message: `${existing.companyName} marked as lost.${lostReason ? ` Reason: ${lostReason}` : ""}`,
        },
      ]

      for (const n of stageNotifications) {
        if (!n.condition) continue
        notify({
          userId: dbUserId,
          channel: "IN_APP",
          type: n.type,
          title: n.title,
          message: n.message,
          metadata: { link: `/portal/crm/${id}` },
        }).catch((err) => logger.error(`Failed to create ${n.type} notification`, err, { dealId: id }))
      }
    }

    return NextResponse.json({ deal })
  } catch (err) {
    logger.error("Failed to update client deal", err, { userId, dealId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const existing = await db.clientDeal.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.clientDeal.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete client deal", err, { userId, dealId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
