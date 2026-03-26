import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const onboardingSchema = z.object({
  subscriptionId: z.string().min(1),
  data: z.record(z.string(), z.string()),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const { subscriptionId, data } = parsed.data

    // Verify the subscription belongs to this user
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        user: { clerkId: userId },
      },
      select: { id: true },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Store onboarding data in the subscription's onboardingData field
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        onboardingData: data,
        fulfillmentStatus: "IN_PROGRESS",
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to save onboarding data", err, { endpoint: "POST /api/portal/onboarding", userId })
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
