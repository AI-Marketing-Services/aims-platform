import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCustomerPortalUrl } from "@/lib/stripe"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { returnUrl } = await req.json().catch(() => ({}))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
  const allowedHost = new URL(appUrl).hostname

  // Validate returnUrl to prevent open redirect
  let safeReturnUrl = `${appUrl}/portal/billing`
  if (returnUrl) {
    try {
      const h = new URL(returnUrl).hostname
      safeReturnUrl = h === allowedHost ? returnUrl : safeReturnUrl
    } catch {
      // ignore invalid URL - use default
    }
  }

  try {
    const user = await getOrCreateDbUserByClerkId(clerkId)
    if (!user.stripeCustomerId) {
      // No subscription yet — surface a friendlier message than 404.
      return NextResponse.json(
        { error: "No billing account yet. Subscribe to a plan to access the billing portal." },
        { status: 404 },
      )
    }

    const url = await getCustomerPortalUrl(user.stripeCustomerId, safeReturnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    logger.error("Failed to create billing portal session:", err)
    return NextResponse.json({ error: "Failed to create billing session" }, { status: 500 })
  }
}
