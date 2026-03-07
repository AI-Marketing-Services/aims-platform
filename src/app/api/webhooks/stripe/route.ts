import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe, handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted, handleInvoicePaid } from "@/lib/stripe"
import { notifyNewPurchase } from "@/lib/notifications"
import { sendWelcomeEmail } from "@/lib/email"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription
        const subscription = await handleSubscriptionCreated(sub)

        if (subscription) {
          // Send notifications
          const user = await db.user.findUnique({ where: { id: subscription.userId } })
          const serviceArm = await db.serviceArm.findUnique({ where: { id: subscription.serviceArmId } })

          if (user && serviceArm) {
            await Promise.allSettled([
              notifyNewPurchase({
                clientName: user.name ?? user.email,
                serviceName: serviceArm.name,
                tier: subscription.tier ?? undefined,
                amount: subscription.monthlyAmount,
              }),
              sendWelcomeEmail({
                to: user.email,
                name: user.name ?? "there",
                serviceName: serviceArm.name,
                tier: subscription.tier ?? undefined,
                portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`,
              }),
            ])
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const sub = await db.subscription.findUnique({
            where: { stripeSubId: invoice.subscription as string },
            include: { user: true },
          })
          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: { status: "PAST_DUE" },
            })
          }
        }
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        // Handle one-time payments if needed
        if (session.mode === "payment") {
          const userId = session.metadata?.userId
          const serviceArmSlug = session.metadata?.serviceArmSlug
          if (userId && serviceArmSlug) {
            // Create a completed deal activity
            const deal = await db.deal.findFirst({
              where: { userId },
              orderBy: { createdAt: "desc" },
            })
            if (deal) {
              await db.dealActivity.create({
                data: {
                  dealId: deal.id,
                  type: "PAYMENT_RECEIVED",
                  detail: `One-time payment of $${((session.amount_total ?? 0) / 100).toFixed(2)} for ${serviceArmSlug}`,
                },
              })
            }
          }
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Return 200 anyway to prevent Stripe retries on business logic errors
  }

  return NextResponse.json({ received: true })
}
