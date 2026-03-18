import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { updateFulfillmentTaskStatus } from "@/lib/fulfillment"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

type RouteContext = { params: Promise<{ taskId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { taskId } = await context.params
    const task = await db.fulfillmentTask.findUnique({
      where: { id: taskId },
      include: {
        subscription: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            serviceArm: { select: { id: true, name: true, slug: true, pillar: true } },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (err) {
    console.error("Failed to fetch fulfillment task:", err)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
})

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { taskId } = await context.params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const { status, ...rest } = parsed.data

    // If status is changing, use the fulfillment lib to recalculate
    if (status) {
      await updateFulfillmentTaskStatus(taskId, status)
    }

    // Update other fields
    const updateData: Record<string, unknown> = {}
    if (rest.title !== undefined) updateData.title = rest.title
    if (rest.description !== undefined) updateData.description = rest.description
    if (rest.assignedTo !== undefined) updateData.assignedTo = rest.assignedTo
    if (rest.priority !== undefined) updateData.priority = rest.priority
    if (rest.dueDate !== undefined) updateData.dueDate = new Date(rest.dueDate)

    if (Object.keys(updateData).length > 0) {
      await db.fulfillmentTask.update({
        where: { id: taskId },
        data: updateData,
      })
    }

    const updated = await db.fulfillmentTask.findUnique({
      where: { id: taskId },
      include: {
        subscription: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            serviceArm: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("Failed to update fulfillment task:", err)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { taskId } = await context.params
    await db.fulfillmentTask.delete({ where: { id: taskId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to delete fulfillment task:", err)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
