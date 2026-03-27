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

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  subscriptionId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      assignedTo: searchParams.get("assignedTo") ?? undefined,
      subscriptionId: searchParams.get("subscriptionId") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
    }

    const { take, skip, status, assignedTo, subscriptionId } = parsed.data

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (assignedTo) where.assignedTo = assignedTo
    if (subscriptionId) where.subscriptionId = subscriptionId

    const [tasks, total] = await Promise.all([
      db.fulfillmentTask.findMany({
        where,
        take,
        skip,
        include: {
          subscription: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              serviceArm: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
      db.fulfillmentTask.count({ where }),
    ])

    return NextResponse.json({ data: tasks, meta: { total, take, skip } })
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
