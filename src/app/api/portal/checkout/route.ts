import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createCheckoutSession } from "@/lib/stripe"

const checkoutSchema = z.object({
  serviceArmId: z.string().min(1),
  tierSlug: z.string().min(1),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json()
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const serviceArm = await db.serviceArm.findUnique({
      where: { id: parsed.data.serviceArmId },
      include: { tiers: true },
    })

    if (!serviceArm) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const tier = serviceArm.tiers.find((t) => t.slug === parsed.data.tierSlug)
    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 })
    }

    if (!tier.stripePriceId) {
      return NextResponse.json({ error: "This tier is not available for online checkout. Please contact us for a custom quote." }, { status: 400 })
    }

    // Check if user already has an active subscription for this service
    const existingSub = await db.subscription.findFirst({
      where: {
        userId: dbUser.id,
        serviceArmId: serviceArm.id,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    })

    if (existingSub) {
      return NextResponse.json({ error: "You already have an active subscription for this service" }, { status: 409 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

    const session = await createCheckoutSession({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      priceId: tier.stripePriceId,
      serviceArmSlug: serviceArm.slug,
      tier: tier.slug,
      successUrl: `${appUrl}/portal/dashboard?checkout=success&service=${serviceArm.slug}`,
      cancelUrl: `${appUrl}/portal/marketplace?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error("Failed to create checkout session", err, { endpoint: "POST /api/portal/checkout" })
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
