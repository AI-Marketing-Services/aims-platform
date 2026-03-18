import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe, handleSubscriptionUpdated, handleSubscriptionDeleted, handleInvoicePaid } from "@/lib/stripe"
import { notifyNewPurchase } from "@/lib/notifications"
import { sendWelcomeEmail } from "@/lib/email"
import { queueEmailSequence } from "@/lib/email/queue"
import { db } from "@/lib/db"
import { createFulfillmentTask } from "@/lib/asana"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Cart-based multi-service checkout ─────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== "subscription") break
        if (session.metadata?.source !== "cart") {
          // Legacy single-service checkout — handled by subscription.created below
          break
        }

        // Resolve the DB user
        let userId = session.metadata?.userId as string | undefined

        if (!userId) {
          // Guest or unlinked — try to find by Clerk ID or email
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

        if (!userId) {
          console.error("checkout.session.completed: could not resolve userId", session.id)
          break
        }

        // Update Stripe customer on user if not already set
        await db.user.update({
          where: { id: userId },
          data: { stripeCustomerId: session.customer as string },
        }).catch((err) => console.error(`Failed to update stripeCustomerId for user ${userId}:`, err))

        // Parse cart items from metadata
        const slugsArr = (session.metadata?.slugs ?? "").split(",").filter(Boolean)
        const tierIdsArr = (session.metadata?.tierIds ?? "").split(",")
        const amountsArr = (session.metadata?.amounts ?? "").split(",").map(Number)

        // Idempotency: if subscription records already exist for this Stripe subscription, skip
        const existingSub = await db.subscription.findUnique({
          where: { stripeSubId: session.subscription as string },
        })
        if (existingSub) {
          console.log(`Subscription ${session.subscription} already exists, skipping duplicate cart processing`)
          break
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
            console.warn(`No service arm found for slug: ${slug}`)
            continue
          }

          // Resolve tier name from map
          let tierName: string | undefined
          if (tierId) {
            const tier = serviceArm.tiers.find((t) => t.slug === tierId)
            tierName = tier?.name
          }

          // Create subscription record
          const subscription = await db.subscription.create({
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
          }).catch((err) => {
            console.error(`Failed to create subscription for ${slug} (stripeSubId: ${session.subscription}):`, err)
            return null
          })

          if (!subscription) continue

          // Auto-create Asana fulfillment task
          if (serviceArm.asanaProjectGid) {
            const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`;
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
              asanaTaskTemplate: (serviceArm.asanaTaskTemplate as { name?: string; notes?: string; subtasks?: string[] }) ?? undefined,
            }).catch((err) => console.error("Asana task creation failed:", err));
          }

          // Create fulfillment tasks from service arm setup steps
          const setupSteps = (serviceArm.setupSteps as Array<{ title: string; description?: string }>) ?? []
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

          // Update existing deal to ACTIVE_CLIENT
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
                    detail: `Subscribed to ${serviceArm.name}${tierName ? ` (${tierName})` : ""} at $${monthlyAmount}/mo`,
                  },
                },
              },
            })
            await db.dealServiceArm.create({
              data: {
                dealId: deal.id,
                serviceArmId: serviceArm.id,
                tier: tierName ?? tierId,
                monthlyPrice: monthlyAmount,
                status: "active",
                activatedAt: new Date(),
              },
            }).catch((err) => console.error(`Failed to create dealServiceArm for deal ${deal.id}:`, err))
          }

          // Notifications + welcome email + post-purchase sequence for first item only
          if (i === 0 && user) {
            await Promise.allSettled([
              notifyNewPurchase({
                clientName: user.name ?? user.email,
                serviceName: slugsArr.length > 1 ? `${serviceArm.name} +${slugsArr.length - 1} more` : serviceArm.name,
                tier: tierName,
                amount: amountsArr.reduce((s, a) => s + a, 0) / 100,
                userId,
              }),
              sendWelcomeEmail({
                to: user.email,
                name: user.name ?? "there",
                serviceName: slugsArr.length > 1 ? `${slugsArr.length} AIMS Services` : serviceArm.name,
                tier: tierName,
                portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`,
              }),
              queueEmailSequence(user.email, "post-purchase", {
                name: user.name ?? "there",
                serviceName: slugsArr.length > 1 ? `${slugsArr.length} AIMS Services` : serviceArm.name,
              }),
            ])
          }
        }
        break
      }

      // ── Legacy single-service direct checkout ─────────────────────────────
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription

        // Skip if this came from a cart checkout (already handled above)
        if (sub.metadata?.source === "cart") break

        const userId = sub.metadata?.userId
        const serviceArmSlug = sub.metadata?.serviceArmSlug
        const tier = sub.metadata?.tier

        if (!userId || !serviceArmSlug) break

        const serviceArm = await db.serviceArm.findUnique({ where: { slug: serviceArmSlug } })
        if (!serviceArm) break

        // Idempotency: check if subscription already exists before creating
        const existingLegacySub = await db.subscription.findUnique({
          where: { stripeSubId: sub.id },
        })
        if (existingLegacySub) {
          console.log(`Subscription ${sub.id} already exists, skipping duplicate creation`)
          break
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
          const legacyUser = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
          const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard`;
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
            asanaTaskTemplate: (serviceArm.asanaTaskTemplate as { name?: string; notes?: string; subtasks?: string[] }) ?? undefined,
          }).catch((err) => console.error("Asana task creation failed (legacy):", err));
        }

        const setupSteps = (serviceArm.setupSteps as Array<{ title: string; description?: string }>) ?? []
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
            notifyNewPurchase({ clientName: user.name ?? user.email, serviceName: serviceArm.name, tier, amount, userId }),
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
        // Mark associated deals as churned
        const existingSub = await db.subscription.findUnique({
          where: { stripeSubId: sub.id },
          select: { userId: true },
        })
        if (existingSub?.userId) {
          const deal = await db.deal.findFirst({
            where: { userId: existingSub.userId, stage: "ACTIVE_CLIENT" },
          })
          if (deal) {
            await db.deal.update({
              where: { id: deal.id },
              data: {
                stage: "CHURNED",
                activities: { create: { type: "SUBSCRIPTION_CANCELLED", detail: "Subscription cancelled via Stripe" } },
              },
            })
          }
        }
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
          await db.subscription.updateMany({
            where: { stripeSubId: invoice.subscription as string },
            data: { status: "PAST_DUE" },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Always return 200 to prevent Stripe retries on business logic errors
  }

  return NextResponse.json({ received: true })
}
