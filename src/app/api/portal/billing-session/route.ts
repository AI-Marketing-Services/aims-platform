import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCustomerPortalUrl } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { returnUrl } = await req.json().catch(() => ({}))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
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
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 })
    }

    const url = await getCustomerPortalUrl(user.stripeCustomerId, safeReturnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    console.error("Failed to create billing portal session:", err)
    return NextResponse.json({ error: "Failed to create billing session" }, { status: 500 })
  }
}
