import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"

const trackSchema = z.object({
  code: z.string(),
  event: z.enum(["click", "signup", "conversion"]),
})

export async function POST(req: Request) {
  if (formRatelimit) {
    const ip = getIp(req)
    const { success } = await formRatelimit.limit(`referrals:${ip}`)
    if (!success) return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = trackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const { code, event } = parsed.data
    const referral = await db.referral.findUnique({ where: { code } })
    if (!referral) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 })
    }

    await db.referral.update({
      where: { code },
      data: {
        clicks: event === "click" ? { increment: 1 } : undefined,
        signups: event === "signup" ? { increment: 1 } : undefined,
        conversions: event === "conversion" ? { increment: 1 } : undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
