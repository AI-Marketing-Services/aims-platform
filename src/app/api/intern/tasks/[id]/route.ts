import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const updateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).optional(),
  actualHours: z.number().min(0).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  // Verify the task belongs to this intern
  const intern = await db.internProfile.findFirst({
    where: { user: { clerkId } },
    select: { id: true },
  })

  if (!intern) {
    return NextResponse.json({ error: "Intern profile not found" }, { status: 403 })
  }

  const task = await db.internTask.findFirst({
    where: { id, internId: intern.id },
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (parsed.data.status) updateData.status = parsed.data.status
    if (parsed.data.actualHours !== undefined) updateData.actualHours = parsed.data.actualHours
    if (parsed.data.status === "DONE") updateData.completedAt = new Date()

    const updated = await db.internTask.update({
      where: { id },
      data: updateData,
    })

    // If completed, increment intern's tasksCompleted count
    if (parsed.data.status === "DONE" && task.status !== "DONE") {
      await db.internProfile.update({
        where: { id: intern.id },
        data: { tasksCompleted: { increment: 1 } },
      })
    }

    return NextResponse.json({ task: updated })
  } catch (err) {
    logger.error(`Failed to update intern task ${id}:`, err)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
