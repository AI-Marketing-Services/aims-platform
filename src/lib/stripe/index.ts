import Stripe from "stripe"
import { db } from "@/lib/db"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

// ============ CUSTOMER ============

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  })

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// ============ CHECKOUT ============

export async function createCheckoutSession(params: {
  userId: string
  email: string
  name?: string
  priceId: string
  serviceArmSlug: string
  tier: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const customerId = await getOrCreateStripeCustomer(
    params.userId,
    params.email,
    params.name
  )

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      serviceArmSlug: params.serviceArmSlug,
      tier: params.tier,
      ...params.metadata,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        serviceArmSlug: params.serviceArmSlug,
        tier: params.tier,
      },
    },
    allow_promotion_codes: true,
  })

  return session
}

export async function createOneTimeCheckout(params: {
  userId: string
  email: string
  name?: string
  amount: number
  productName: string
  serviceArmSlug: string
  successUrl: string
  cancelUrl: string
}) {
  const customerId = await getOrCreateStripeCustomer(
    params.userId,
    params.email,
    params.name
  )

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: params.productName },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      serviceArmSlug: params.serviceArmSlug,
    },
  })

  return session
}

// ============ SUBSCRIPTION MANAGEMENT ============

export async function cancelSubscription(stripeSubId: string) {
  return stripe.subscriptions.update(stripeSubId, {
    cancel_at_period_end: true,
  })
}

export async function resumeSubscription(stripeSubId: string) {
  return stripe.subscriptions.update(stripeSubId, {
    cancel_at_period_end: false,
  })
}

export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// ============ WEBHOOK HANDLERS ============

export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId
  const serviceArmSlug = sub.metadata.serviceArmSlug
  const tier = sub.metadata.tier

  if (!userId || !serviceArmSlug) return

  const serviceArm = await db.serviceArm.findUnique({
    where: { slug: serviceArmSlug },
  })
  if (!serviceArm) return

  const amount =
    (sub.items.data[0]?.price?.unit_amount ?? 0) / 100

  // Create subscription record
  const subscription = await db.subscription.create({
    data: {
      userId,
      serviceArmId: serviceArm.id,
      stripeSubId: sub.id,
      stripeCustId: sub.customer as string,
      status: "ACTIVE",
      tier,
      monthlyAmount: amount,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      assignedTeamMember: serviceArm.defaultAssignee,
    },
  })

  // Create initial fulfillment tasks from service arm setup steps
  const setupSteps = (serviceArm.setupSteps as Array<{ title: string; description?: string }>) ?? []
  if (setupSteps.length > 0) {
    await db.fulfillmentTask.createMany({
      data: setupSteps.map((step, i) => ({
        subscriptionId: subscription.id,
        title: step.title,
        description: step.description,
        assignedTo: serviceArm.defaultAssignee,
        priority: i === 0 ? "high" : "medium",
        dueDate: new Date(Date.now() + (i + 1) * 86400000 * 2), // 2 days apart
      })),
    })
  }

  // Update deal to ACTIVE_CLIENT if exists
  const deal = await db.deal.findFirst({
    where: { userId, stage: { not: "ACTIVE_CLIENT" } },
    orderBy: { createdAt: "desc" },
  })

  if (deal) {
    await db.deal.update({
      where: { id: deal.id },
      data: {
        stage: "ACTIVE_CLIENT",
        closedAt: new Date(),
        activities: {
          create: {
            type: "SUBSCRIPTION_CREATED",
            detail: `Subscribed to ${serviceArm.name} (${tier ?? "default"}) at $${amount}/mo`,
          },
        },
      },
    })

    await db.dealServiceArm.create({
      data: {
        dealId: deal.id,
        serviceArmId: serviceArm.id,
        tier,
        monthlyPrice: amount,
        status: "active",
        activatedAt: new Date(),
      },
    })
  }

  return subscription
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const existing = await db.subscription.findFirst({
    where: { stripeSubId: sub.id },
  })
  if (!existing) return

  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" | "PAUSED"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELLED",
    trialing: "TRIALING",
    paused: "PAUSED",
  }

  await db.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: statusMap[sub.status] ?? "ACTIVE",
      monthlyAmount: (sub.items.data[0]?.price?.unit_amount ?? 0) / 100,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  })
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  })
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const sub = await db.subscription.findFirst({
    where: { stripeSubId: invoice.subscription as string },
    include: { user: true },
  })
  if (!sub) return

  // Log payment activity on associated deal
  const deal = await db.deal.findFirst({
    where: { userId: sub.userId },
    orderBy: { createdAt: "desc" },
  })

  if (deal) {
    await db.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "PAYMENT_RECEIVED",
        detail: `Payment of $${(invoice.amount_paid / 100).toFixed(2)} received`,
      },
    })
  }
}
