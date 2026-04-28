import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { cancelSubscription } from "@/lib/stripe"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const cancelSchema = z.object({
  subscriptionId: z.string().min(1),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 })
  }

  const { subscriptionId } = parsed.data

  const dbUser = await getOrCreateDbUserByClerkId(clerkId)
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Verify this subscription belongs to the authenticated user
  const subscription = await db.subscription.findFirst({
    where: { id: subscriptionId, userId: dbUser.id },
  })

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  if (!subscription.stripeSubId) {
    return NextResponse.json({ error: "No Stripe subscription linked" }, { status: 400 })
  }

  try {
    await cancelSubscription(subscription.stripeSubId)
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to cancel subscription:", err)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
