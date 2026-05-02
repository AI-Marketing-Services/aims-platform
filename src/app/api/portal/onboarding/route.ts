import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// Onboarding form data is heterogeneous — strings, booleans, arrays of
// checkbox values, sometimes nested objects (multi-step forms). Restricting
// to flat string records silently dropped any structured data the form sent.
// Allow any JSON-serialisable value (Prisma's Json column accepts it).
const onboardingValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(onboardingValueSchema),
    z.record(z.string(), onboardingValueSchema),
  ])
)

const onboardingSchema = z.object({
  subscriptionId: z.string().min(1),
  data: z.record(z.string(), onboardingValueSchema),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // JSON parse outside the main try so a malformed body returns a real 400
  // instead of being swallowed as a generic 500 with no useful detail.
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
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

    // Store onboarding data in the subscription's onboardingData field.
    // Cast to Prisma's InputJsonValue — the schema validates that all values
    // are JSON-serialisable, so this cast is sound but TS can't see that
    // through the recursive Zod type.
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        onboardingData: data as Prisma.InputJsonValue,
        fulfillmentStatus: "IN_PROGRESS",
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to save onboarding data", err, { endpoint: "POST /api/portal/onboarding", userId })
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
