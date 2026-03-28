import Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from "@/lib/stripe"
import { notifyNewPurchase } from "@/lib/notifications"
import { sendWelcomeEmail, sendCancellationEmail } from "@/lib/email"
import { queueEmailSequence } from "@/lib/email/queue"
import { createFulfillmentTask } from "@/lib/asana"

/**
 * Handles customer.subscription.created for legacy single-service direct checkout.
 * Cart-based checkouts set source=cart in metadata and are handled by checkout.session.completed.
 */
export async function handleSubscriptionCreatedEvent(sub: Stripe.Subscription) {
  // Skip if this came from a cart checkout (already handled by checkout handler)
  if (sub.metadata?.source === "cart") return

  const userId = sub.metadata?.userId
  const serviceArmSlug = sub.metadata?.serviceArmSlug
  const tier = sub.metadata?.tier

  if (!userId || !serviceArmSlug) return

  const serviceArm = await db.serviceArm.findUnique({ where: { slug: serviceArmSlug } })
  if (!serviceArm) return

  // Idempotency: check if subscription already exists before creating
  const existingLegacySub = await db.subscription.findFirst({
    where: { stripeSubId: sub.id },
  })
  if (existingLegacySub) {
    logger.warn(`Subscription ${sub.id} already exists, skipping duplicate creation`)
    return
  }

  const amount = (sub.items.data[0]?.price?.unit_amount ?? 0) / 100

  const subscription = await db.subscription.create({
    data: {
      userId,
      serviceArmId: serviceArm.id,
      stripeSubId: sub.id,
      stripeCustId: sub.customer as string,
      status: "ACTIVE",
      tier,
      monthlyAmount: amount,
      fulfillmentStatus: "PENDING_SETUP",
      assignedTeamMember: serviceArm.defaultAssignee,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
  })

  // Auto-create Asana fulfillment task (legacy single-service checkout)
  if (serviceArm.asanaProjectGid) {
    const legacyUser = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`
    await createFulfillmentTask({
      clientName: legacyUser?.name ?? "New Client",
      clientEmail: legacyUser?.email ?? "",
      serviceName: serviceArm.name,
      tier,
      monthlyAmount: amount,
      subscriptionId: subscription.id,
      portalUrl,
      asanaProjectGid: serviceArm.asanaProjectGid,
      asanaAssigneeGid: serviceArm.asanaAssigneeGid ?? undefined,
      asanaTaskTemplate:
        (serviceArm.asanaTaskTemplate as {
          name?: string
          notes?: string
          subtasks?: string[]
        }) ?? undefined,
    }).catch((err) => logger.error("Asana task creation failed (legacy)", err))
  }

  const setupSteps =
    (serviceArm.setupSteps as Array<{ title: string; description?: string }>) ?? []
  if (setupSteps.length > 0) {
    await db.fulfillmentTask.createMany({
      data: setupSteps.map((step, i) => ({
        subscriptionId: subscription.id,
        title: step.title,
        description: step.description,
        assignedTo: serviceArm.defaultAssignee,
        priority: i === 0 ? "high" : "medium",
        dueDate: new Date(Date.now() + (i + 1) * 2 * 86400000),
      })),
    })
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    await Promise.allSettled([
      notifyNewPurchase({
        clientName: user.name ?? user.email,
        serviceName: serviceArm.name,
        tier,
        amount,
        userId,
      }),
      sendWelcomeEmail({
        to: user.email,
        name: user.name ?? "there",
        serviceName: serviceArm.name,
        tier,
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`,
      }),
      queueEmailSequence(user.email, "post-purchase", {
        name: user.name ?? "there",
        serviceName: serviceArm.name,
      }),
    ])
  }
}

/**
 * Handles customer.subscription.updated events.
 */
export async function handleSubscriptionUpdatedEvent(sub: Stripe.Subscription) {
  await handleSubscriptionUpdated(sub)
}

/**
 * Handles customer.subscription.deleted events — cancels the subscription
 * and marks associated deals as churned.
 */
export async function handleSubscriptionDeletedEvent(sub: Stripe.Subscription) {
  // Fetch before deletion so we have service arm name for the email
  const existingSub = await db.subscription.findFirst({
    where: { stripeSubId: sub.id },
    include: { user: true, serviceArm: true },
  })

  await handleSubscriptionDeleted(sub)

  // Mark associated deals as churned
  if (existingSub?.userId) {
    const deal = await db.deal.findFirst({
      where: { userId: existingSub.userId, stage: "ACTIVE_CLIENT" },
    })
    if (deal) {
      await db.deal.update({
        where: { id: deal.id },
        data: {
          stage: "CHURNED",
          activities: {
            create: {
              type: "SUBSCRIPTION_CANCELLED",
              detail: "Subscription cancelled via Stripe",
            },
          },
        },
      })
    }

    // Send cancellation confirmation email to client
    if (existingSub.user) {
      await sendCancellationEmail({
        to: existingSub.user.email,
        name: existingSub.user.name ?? "there",
        serviceName: existingSub.serviceArm.name,
        cancelledAt: new Date(),
      }).catch((err) => logger.error("Failed to send cancellation email", err))
    }
  }
}
