import { db } from "@/lib/db"
import type { FulfillmentStatus } from "@prisma/client"

/**
 * Recalculate and update the subscription's fulfillment status
 * based on the state of its fulfillment tasks.
 */
export async function recalculateFulfillmentStatus(subscriptionId: string) {
  const tasks = await db.fulfillmentTask.findMany({
    where: { subscriptionId },
    select: { status: true },
  })

  if (tasks.length === 0) return

  const allDone = tasks.every(t => t.status === "done")
  const anyInProgress = tasks.some(t => t.status === "in_progress" || t.status === "in_review")
  const anyBlocked = tasks.some(t => t.status === "blocked" || t.status === "needs_attention")

  let newStatus: FulfillmentStatus = "PENDING_SETUP"

  if (allDone) {
    newStatus = "ACTIVE_MANAGED"
  } else if (anyBlocked) {
    newStatus = "NEEDS_ATTENTION"
  } else if (anyInProgress) {
    newStatus = "IN_PROGRESS"
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { fulfillmentStatus: newStatus },
  })

  return newStatus
}

/**
 * Mark a fulfillment task as complete and recalculate subscription status.
 */
export async function completeFulfillmentTask(taskId: string) {
  await db.fulfillmentTask.update({
    where: { id: taskId },
    data: { status: "done", completedAt: new Date() },
  })

  const task = await db.fulfillmentTask.findUnique({
    where: { id: taskId },
    select: { subscriptionId: true },
  })

  if (task) {
    await recalculateFulfillmentStatus(task.subscriptionId)
  }
}

/**
 * Update a fulfillment task's status and recalculate.
 */
export async function updateFulfillmentTaskStatus(
  taskId: string,
  status: string
) {
  const data: Record<string, unknown> = { status }
  if (status === "done") data.completedAt = new Date()

  await db.fulfillmentTask.update({ where: { id: taskId }, data })

  const task = await db.fulfillmentTask.findUnique({
    where: { id: taskId },
    select: { subscriptionId: true },
  })

  if (task) {
    await recalculateFulfillmentStatus(task.subscriptionId)
  }
}
