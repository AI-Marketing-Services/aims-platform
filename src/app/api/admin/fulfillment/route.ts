import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { updateFulfillmentTaskStatus } from "@/lib/fulfillment"
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assignedTo")
    const subscriptionId = searchParams.get("subscriptionId")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (assignedTo) where.assignedTo = assignedTo
    if (subscriptionId) where.subscriptionId = subscriptionId

    const tasks = await db.fulfillmentTask.findMany({
      where,
      include: {
        subscription: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            serviceArm: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(tasks)
  } catch (err) {
    logger.error("Failed to fetch fulfillment tasks:", err)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

const patchSchema = z.object({
  taskId: z.string().min(1),
  status: z.string().min(1),
  assignedTo: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const { taskId, status, assignedTo } = parsed.data

    await updateFulfillmentTaskStatus(taskId, status)

    if (assignedTo !== undefined) {
      await db.fulfillmentTask.update({
        where: { id: taskId },
        data: { assignedTo },
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
    logger.error("Failed to update fulfillment task:", err)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
