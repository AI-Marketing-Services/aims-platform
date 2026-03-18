import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  try {
    const referral = await db.referral.findUnique({
      where: { code },
      select: {
        code: true,
        tier: true,
        landingPageSlug: true,
        referrer: { select: { name: true, company: true } },
      },
    })

    if (!referral) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    return NextResponse.json({ valid: true, referral })
  } catch (err) {
    console.error("Referral validation failed:", err)
    return NextResponse.json({ error: "Failed to validate referral" }, { status: 500 })
  }
}
