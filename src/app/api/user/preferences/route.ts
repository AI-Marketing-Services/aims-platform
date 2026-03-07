import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const prefsSchema = z.object({
  emailNotifs: z.boolean().optional(),
  slackNotifs: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = prefsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const user = await db.user.update({
    where: { clerkId: userId },
    data: parsed.data,
    select: { emailNotifs: true, slackNotifs: true },
  })

  return NextResponse.json(user)
}
