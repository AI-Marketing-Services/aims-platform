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
import {
  handleProductCheckoutCompleted,
  handleProductInvoicePaid,
  handleProductSubscriptionDeleted,
  handleProductSubscriptionUpdated,
  handleProductChargeRefunded,
} from "@/lib/stripe/handlers/handle-product-purchase"
import { handleCreditTopupCompleted } from "@/lib/stripe/handlers/handle-credit-topup"

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

  // Livemode guard: in production, refuse test-mode events. Without this,
  // a misconfigured STRIPE_WEBHOOK_SECRET pointing at a test endpoint would
  // create real DB rows (Subscriptions, Purchases, Commissions) for fake
  // payments — silently corrupting prod data.
  if (process.env.NODE_ENV === "production" && !event.livemode) {
    logger.error(
      "Stripe webhook received non-livemode event in production — refusing",
      null,
      {
        endpoint: "POST /api/webhooks/stripe",
        action: event.type,
        livemode: event.livemode,
      }
    )
    return NextResponse.json(
      { error: "Test-mode event refused in production" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        // Multiple checkout variants run through this event type. Each
        // handler self-gates on metadata.source and bails fast if it
        // isn't its own variant.
        await handleCheckoutCompleted(session)
        await handleProductCheckoutCompleted(session)
        await handleCreditTopupCompleted(session)
        break
      }

      case "customer.subscription.created":
        await handleSubscriptionCreatedEvent(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdatedEvent(sub)
        await handleProductSubscriptionUpdated(sub)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeletedEvent(sub)
        await handleProductSubscriptionDeleted(sub)
        break
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice
        await handleInvoicePaidEvent(inv)
        await handleProductInvoicePaid(inv)
        break
      }

      case "invoice.payment_failed":
        await handleInvoicePaymentFailedEvent(event.data.object as Stripe.Invoice)
        break

      case "charge.refunded":
        await handleProductChargeRefunded(event.data.object as Stripe.Charge)
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
