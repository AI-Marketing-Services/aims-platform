import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createDealSchema } from "@/lib/crm/schemas"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

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
      include: {
        contacts: { select: { id: true, firstName: true, lastName: true, email: true, isPrimary: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { updatedAt: "desc" },
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

    return NextResponse.json({ deal }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create client deal", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
