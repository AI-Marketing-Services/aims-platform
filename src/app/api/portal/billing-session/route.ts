import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCustomerPortalUrl } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { returnUrl } = await req.json().catch(() => ({}))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 })
  }

  const url = await getCustomerPortalUrl(
    user.stripeCustomerId,
    returnUrl ?? `${appUrl}/portal/billing`
  )

  return NextResponse.json({ url })
}
