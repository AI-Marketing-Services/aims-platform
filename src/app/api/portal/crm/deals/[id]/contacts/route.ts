import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createContactSchema } from "@/lib/crm/schemas"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { markQuestEvent } from "@/lib/quests"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

async function verifyDealOwner(dealId: string, userId: string) {
  const deal = await db.clientDeal.findFirst({ where: { id: dealId, userId }, select: { id: true } })
  return !!deal
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const isOwner = await verifyDealOwner(dealId, dbUserId)
  if (!isOwner) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createContactSchema.safeParse(body)
    if (!parsed.success) {
      // Surface the first human-readable issue message in `error` so the
      // UI's toast shows something actionable
      // (e.g. "Add at least one of: last name, email, or phone") instead
      // of a generic "Invalid data" string.
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Invalid contact data",
          issues: parsed.error.issues,
        },
        { status: 400 },
      )
    }

    const { email, ...rest } = parsed.data

    const [contact] = await db.$transaction([
      db.clientContact.create({
        data: {
          clientDealId: dealId,
          email: email || null,
          ...rest,
        },
      }),
      db.clientDealActivity.create({
        data: {
          clientDealId: dealId,
          type: "CONTACT_ADDED",
          description: `Contact added: ${parsed.data.firstName}${parsed.data.lastName ? ` ${parsed.data.lastName}` : ""}`,
        },
      }),
    ])

    // Quest: First Lead
    void markQuestEvent(dbUserId, "crm.first_contact_added", {
      metadata: { dealId, contactId: contact.id },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    logger.error("Failed to add contact", err, { userId, dealId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const isOwner = await verifyDealOwner(dealId, dbUserId)
  if (!isOwner) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const contactId = searchParams.get("contactId")
  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 })

  try {
    await db.clientContact.deleteMany({ where: { id: contactId, clientDealId: dealId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete contact", err, { userId, dealId, contactId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
