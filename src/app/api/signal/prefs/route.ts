import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const E164 = /^\+[1-9]\d{7,14}$/

const patchSchema = z.object({
  notifSignalDigest: z.boolean().optional(),
  signalSmsOptIn: z.boolean().optional(),
  signalPhoneE164: z.string().regex(E164, "Must be E.164 format (e.g. +15551234567)").nullable().optional(),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { notifSignalDigest: true, signalSmsOptIn: true, signalPhoneE164: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  if (data.signalSmsOptIn === true && data.signalPhoneE164 === undefined) {
    const existing = await db.user.findUnique({ where: { clerkId: userId }, select: { signalPhoneE164: true } })
    if (!existing?.signalPhoneE164) {
      return NextResponse.json({ error: "Phone required to enable SMS" }, { status: 400 })
    }
  }

  const user = await db.user.update({
    where: { clerkId: userId },
    data,
    select: { notifSignalDigest: true, signalSmsOptIn: true, signalPhoneE164: true },
  })
  return NextResponse.json(user)
}
