import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const eodSchema = z.object({
  internId: z.string(),
  completed: z.array(z.string()).min(1),
  nextPriority: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  hoursWorked: z.number().optional().nullable(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = eodSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const { internId, completed, nextPriority, blockers, hoursWorked } = parsed.data

  // Verify ownership
  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await db.internProfile.findFirst({
    where: { id: internId, userId: dbUser.id },
  })

  // Allow admins to create reports for any intern
  const role = dbUser.role
  if (!profile && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const report = await db.eODReport.create({
    data: {
      internId,
      completed,
      nextPriority: nextPriority ?? [],
      blockers: blockers ?? [],
      hoursWorked: hoursWorked ?? null,
      date: new Date(),
    },
  })

  return NextResponse.json(report, { status: 201 })
}
