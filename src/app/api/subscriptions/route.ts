import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { createCheckoutSession } from "@/lib/stripe"
import { getServiceArmBySlug } from "@/lib/db/queries"

const checkoutSchema = z.object({
  serviceArmSlug: z.string(),
  tier: z.string(),
  metadata: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const serviceArm = await getServiceArmBySlug(parsed.data.serviceArmSlug)
    if (!serviceArm) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const tier = serviceArm.tiers.find((t) => t.slug === parsed.data.tier)
    if (!tier?.stripePriceId) {
      return NextResponse.json({ error: "Tier not found or not configured in Stripe" }, { status: 400 })
    }

    const email = user.emailAddresses[0]?.emailAddress ?? ""
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

    const session = await createCheckoutSession({
      userId,
      email,
      name,
      priceId: tier.stripePriceId,
      serviceArmSlug: serviceArm.slug,
      tier: tier.slug,
      successUrl: `${appUrl}/portal/dashboard?checkout=success&service=${serviceArm.slug}`,
      cancelUrl: `${appUrl}/services/${serviceArm.slug}?checkout=cancelled`,
      metadata: parsed.data.metadata,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Subscription checkout failed:", err)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}
