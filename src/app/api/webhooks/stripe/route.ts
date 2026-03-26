import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"
import { handleCheckoutCompleted } from "@/lib/stripe/handlers/handle-checkout-completed"
import {
  handleSubscriptionCreatedEvent,
  handleSubscriptionUpdatedEvent,
  handleSubscriptionDeletedEvent,
} from "@/lib/stripe/handlers/handle-subscription-lifecycle"
import {
  handleInvoicePaidEvent,
  handleInvoicePaymentFailedEvent,
} from "@/lib/stripe/handlers/handle-invoice"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured", undefined, {
      endpoint: "POST /api/webhooks/stripe",
    })
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", err, {
      endpoint: "POST /api/webhooks/stripe",
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.created":
        await handleSubscriptionCreatedEvent(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdatedEvent(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeletedEvent(event.data.object as Stripe.Subscription)
        break

      case "invoice.paid":
        await handleInvoicePaidEvent(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailedEvent(event.data.object as Stripe.Invoice)
        break
    }
  } catch (err) {
    logger.error("Error handling Stripe webhook event", err, {
      endpoint: "POST /api/webhooks/stripe",
      action: event.type,
    })
    // Always return 200 to prevent Stripe retries on business logic errors
  }

  return NextResponse.json({ received: true })
}
