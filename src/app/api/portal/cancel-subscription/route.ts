import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cancelSubscription } from "@/lib/stripe"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subscriptionId } = await req.json()
  if (!subscriptionId || typeof subscriptionId !== "string") {
    return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 })
  }

  const dbUser = await db.user.findUnique({ where: { clerkId } })
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
