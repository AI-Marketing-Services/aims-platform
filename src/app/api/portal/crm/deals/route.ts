import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createDealSchema } from "@/lib/crm/schemas"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"
import { markQuestEvent } from "@/lib/quests"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const deals = await db.clientDeal.findMany({
      where: { userId: dbUserId },
      // Explicit select — ClientDeal carries text blobs (notes) we don't
      // need on the list view. Keeping payloads small keeps the kanban
      // snappy as deal counts grow.
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        website: true,
        industry: true,
        stage: true,
        value: true,
        currency: true,
        tags: true,
        leadScore: true,
        lastEnrichedAt: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        wonAt: true,
        lostAt: true,
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isPrimary: true,
          },
        },
        _count: { select: { activities: true } },
      },
      orderBy: { updatedAt: "desc" },
      // Cap to a sane upper bound. Operators with >500 active deals
      // need a paginated UI anyway — the kanban can't render that many
      // cards usefully. Older/won/lost deals remain queryable via filters.
      take: 500,
    })
    return NextResponse.json({ deals })
  } catch (err) {
    logger.error("Failed to fetch client deals", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createDealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { contactName, contactEmail, contactPhone, website, tags, value, ...rest } = parsed.data

    const deal = await db.clientDeal.create({
      data: {
        userId: dbUserId,
        contactName: contactName ?? null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone ?? null,
        website: website || null,
        tags: tags ?? [],
        value: value ?? 0,
        ...rest,
        activities: {
          create: {
            type: "NOTE",
            description: "Deal created",
          },
        },
      },
      include: {
        contacts: true,
        _count: { select: { activities: true } },
      },
    })

    void emitEvent({
      actorId: dbUserId,
      type: EVENT_TYPES.DEAL_CREATED,
      entityType: "ClientDeal",
      entityId: deal.id,
      metadata: {
        companyName: deal.companyName,
        stage: deal.stage,
        value: deal.value,
        source: deal.source ?? "manual",
      },
    })

    // Quest: First Lead
    void markQuestEvent(dbUserId, "crm.first_contact_added", {
      metadata: { dealId: deal.id },
    })

    // Quest: First Closed Deal — when deal is created at a "won" stage
    if (deal.stage === "ACTIVE_RETAINER" || deal.stage === "COMPLETED") {
      void markQuestEvent(dbUserId, "deal.first_closed_won", {
        metadata: { dealId: deal.id },
      })
    }

    return NextResponse.json({ deal }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create client deal", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
