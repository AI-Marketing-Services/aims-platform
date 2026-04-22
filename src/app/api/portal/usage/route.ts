import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getMonthlyUsage, MONTHLY_ALLOWANCES } from "@/lib/usage"

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const usage = await getMonthlyUsage(dbUserId)

  const summary = Object.entries(usage).map(([type, used]) => ({
    type,
    used,
    allowance: MONTHLY_ALLOWANCES[type as keyof typeof MONTHLY_ALLOWANCES] ?? 0,
    remaining: Math.max(0, (MONTHLY_ALLOWANCES[type as keyof typeof MONTHLY_ALLOWANCES] ?? 0) - used),
  }))

  return NextResponse.json({ usage: summary })
}
