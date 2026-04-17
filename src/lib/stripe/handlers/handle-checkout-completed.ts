import Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notifyNewPurchase } from "@/lib/notifications"
import { sendWelcomeEmail } from "@/lib/email"
import { queueEmailSequence } from "@/lib/email/queue"
import { createFulfillmentTask } from "@/lib/asana"
import { getDubClient } from "@/lib/dub"

/**
 * Handles checkout.session.completed events for cart-based multi-service checkout.
 * Legacy single-service checkouts are handled by subscription.created instead.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return
  if (session.metadata?.source !== "cart") return

  const userId = await resolveUserId(session)
  if (!userId) {
    logger.error("checkout.session.completed: could not resolve userId", undefined, {
      endpoint: "POST /api/webhooks/stripe",
      action: session.id,
    })
    return
  }

  // Update Stripe customer on user if not already set
  await db.user
    .update({
      where: { id: userId },
      data: { stripeCustomerId: session.customer as string },
    })
    .catch((err) => logger.error("Failed to update stripeCustomerId", err, { userId }))

  // Parse cart items from metadata
  const slugsArr = (session.metadata?.slugs ?? "").split(",").filter(Boolean)
  const tierIdsArr = (session.metadata?.tierIds ?? "").split(",")
  const amountsArr = (session.metadata?.amounts ?? "").split(",").map(Number)

  // Validate array lengths match to prevent out-of-bounds access
  if (
    slugsArr.length === 0 ||
    tierIdsArr.length < slugsArr.length ||
    amountsArr.length < slugsArr.length
  ) {
    logger.error("checkout.session.completed: metadata array length mismatch", undefined, {
      endpoint: "POST /api/webhooks/stripe",
      action: `slugs:${slugsArr.length},tiers:${tierIdsArr.length},amounts:${amountsArr.length}`,
    })
    return
  }

  // Idempotency: if subscription records already exist for this Stripe subscription, skip
  const existingSub = await db.subscription.findFirst({
    where: { stripeSubId: session.subscription as string },
  })
  if (existingSub) {
    logger.warn(`Subscription ${session.subscription} already exists, skipping duplicate cart processing`)
    return
  }

  const user = await db.user.findUnique({ where: { id: userId } })

  // Batch load all service arms + tiers to avoid N+1 queries
  const allServiceArms = await db.serviceArm.findMany({
    where: { slug: { in: slugsArr } },
    include: { tiers: true },
  })
  const serviceArmMap = new Map(allServiceArms.map((s) => [s.slug, s]))

  for (let i = 0; i < slugsArr.length; i++) {
    const slug = slugsArr[i]
    const tierId = tierIdsArr[i] || undefined
    const monthlyAmount = (amountsArr[i] ?? 0) / 100

    const serviceArm = serviceArmMap.get(slug)
    if (!serviceArm) {
      logger.warn(`No service arm found for slug: ${slug}`)
      continue
    }

    // Resolve tier name from map
    let tierName: string | undefined
    if (tierId) {
      const tier = serviceArm.tiers.find((t) => t.slug === tierId)
      tierName = tier?.name
    }

    // Create subscription record
    const subscription = await db.subscription
      .create({
        data: {
          userId,
          serviceArmId: serviceArm.id,
          stripeSubId: session.subscription as string,
          stripeCustId: session.customer as string,
          status: "ACTIVE",
          tier: tierName ?? tierId,
          monthlyAmount,
          fulfillmentStatus: "PENDING_SETUP",
          assignedTeamMember: serviceArm.defaultAssignee,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      })
      .catch((err) => {
        logger.error(`Failed to create subscription for ${slug}`, err, {
          endpoint: "POST /api/webhooks/stripe",
          action: `stripeSubId:${session.subscription}`,
        })
        return null
      })

    if (!subscription) continue

    // Auto-create Asana fulfillment task
    if (serviceArm.asanaProjectGid) {
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`
      await createFulfillmentTask({
        clientName: user?.name ?? session.customer_details?.name ?? "New Client",
        clientEmail: user?.email ?? session.customer_details?.email ?? "",
        serviceName: serviceArm.name,
        tier: tierName,
        monthlyAmount,
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
      }).catch((err) => logger.error("Asana task creation failed", err))
    }

    // Create fulfillment tasks from service arm setup steps
    const setupSteps =
      (serviceArm.setupSteps as Array<{ title: string; description?: string }>) ?? []
    if (setupSteps.length > 0) {
      await db.fulfillmentTask.createMany({
        data: setupSteps.map((step, j) => ({
          subscriptionId: subscription.id,
          title: step.title,
          description: step.description,
          assignedTo: serviceArm.defaultAssignee,
          priority: j === 0 ? "high" : "medium",
          dueDate: new Date(Date.now() + (j + 1) * 2 * 86400000),
        })),
      })
    }

    // Update existing deal to MEMBER_JOINED (paid subscribers are joined)
    const deal = await db.deal.findFirst({
      where: { userId, stage: { not: "MEMBER_JOINED" } },
      orderBy: { createdAt: "desc" },
    })

    if (deal) {
      await db.deal.update({
        where: { id: deal.id },
        data: {
          stage: "MEMBER_JOINED",
          closedAt: new Date(),
          activities: {
            create: {
              type: "SUBSCRIPTION_CREATED",
              detail: `Subscribed to ${serviceArm.name}${tierName ? ` (${tierName})` : ""} at $${monthlyAmount}/mo`,
            },
          },
        },
      })
      await db.dealServiceArm
        .create({
          data: {
            dealId: deal.id,
            serviceArmId: serviceArm.id,
            tier: tierName ?? tierId,
            monthlyPrice: monthlyAmount,
            status: "active",
            activatedAt: new Date(),
          },
        })
        .catch((err) => logger.error("Failed to create dealServiceArm", err, { dealId: deal.id }))
    }

    // Report sale to Dub.co (non-blocking)
    const dub = await getDubClient()
    if (dub && userId) {
      dub.track.sale({
        customerExternalId: userId,
        amount: monthlyAmount * 100,
        currency: "usd",
        paymentProcessor: "stripe",
        invoiceId: session.id,
        metadata: { serviceArm: slug, tier: tierName },
      }).catch((err) => {
        logger.error("Failed to report sale to Dub.co", err, {
          action: "dub:track:sale",
        })
      })
    }

    // Notifications + welcome email + post-purchase sequence for first item only
    if (i === 0 && user) {
      await Promise.allSettled([
        notifyNewPurchase({
          clientName: user.name ?? user.email,
          serviceName:
            slugsArr.length > 1
              ? `${serviceArm.name} +${slugsArr.length - 1} more`
              : serviceArm.name,
          tier: tierName,
          amount: amountsArr.reduce((s, a) => s + a, 0) / 100,
          userId,
        }),
        sendWelcomeEmail({
          to: user.email,
          name: user.name ?? "there",
          serviceName:
            slugsArr.length > 1 ? `${slugsArr.length} AIMS Services` : serviceArm.name,
          tier: tierName,
          portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`,
        }),
        queueEmailSequence(user.email, "post-purchase", {
          name: user.name ?? "there",
          serviceName:
            slugsArr.length > 1 ? `${slugsArr.length} AIMS Services` : serviceArm.name,
        }),
      ])
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function resolveUserId(session: Stripe.Checkout.Session): Promise<string | undefined> {
  let userId = session.metadata?.userId as string | undefined

  if (!userId) {
    const clerkId = session.client_reference_id
    const email = session.customer_details?.email

    if (clerkId) {
      const user = await db.user.findFirst({ where: { clerkId } })
      userId = user?.id
    }
    if (!userId && email) {
      const user = await db.user.findFirst({ where: { email } })
      userId = user?.id
    }
    if (!userId && email) {
      // Upsert to handle race conditions with concurrent webhooks
      const newUser = await db.user.upsert({
        where: { email },
        update: {
          stripeCustomerId: session.customer as string,
        },
        create: {
          clerkId: session.client_reference_id ?? `guest_${Date.now()}`,
          email,
          name: session.customer_details?.name ?? undefined,
          stripeCustomerId: session.customer as string,
        },
      })
      userId = newUser.id
    }
  }

  return userId
}
