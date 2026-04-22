import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { scoutLeads } from "@/lib/crm/lead-scout"
import { z } from "zod"

const scoutSchema = z.object({
  businessType: z.string().min(2).max(80),
  location: z.string().min(2).max(120),
  count: z.number().int().min(1).max(20).optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = scoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", issues: parsed.error.issues }, { status: 400 })
    }

    const leads = await scoutLeads({
      businessType: parsed.data.businessType,
      location: parsed.data.location,
      count: parsed.data.count ?? 8,
      userId: dbUserId,
    })

    return NextResponse.json({ leads, count: leads.length })
  } catch (err) {
    logger.error("Lead scout API failed", err, { userId })
    return NextResponse.json({ error: "Failed to search for leads" }, { status: 500 })
  }
}
