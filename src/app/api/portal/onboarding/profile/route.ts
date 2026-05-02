import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { profileSchema } from "@/lib/onboarding/schemas"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { markQuestEvent } from "@/lib/quests"

async function resolveDbUser(clerkId: string) {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return { id: user.id }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = await db.memberProfile.findUnique({
      where: { userId: dbUser.id },
    })

    return NextResponse.json({ profile })
  } catch (err) {
    logger.error("Failed to get member profile", err, {
      endpoint: "GET /api/portal/onboarding/profile",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const profile = await db.memberProfile.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, ...parsed.data },
      update: { ...parsed.data },
    })

    // Write DealActivity if a Deal is linked to this user
    const deal = await db.deal.findFirst({
      where: { userId: dbUser.id },
      select: { id: true },
    })
    if (deal) {
      await db.dealActivity.create({
        data: {
          dealId: deal.id,
          type: "MEMBER_PROFILE_UPDATED",
          detail: "Member updated their profile",
          authorId: dbUser.id,
          metadata: {},
        },
      })
    }

    // Quest: Operator Profile Complete (fires when the three core fields exist)
    if (
      profile.businessName &&
      profile.niche &&
      profile.oneLiner
    ) {
      void markQuestEvent(dbUser.id, "profile.completed", {
        metadata: { profileId: profile.id },
      })
    }

    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    logger.error("Failed to update member profile", err, {
      endpoint: "PUT /api/portal/onboarding/profile",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
