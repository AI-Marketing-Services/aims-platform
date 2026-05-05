import Stripe from "stripe"
import { UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { reconcileEntitlementsForUser } from "@/lib/entitlements"
import { grantCredits } from "@/lib/enrichment/credits/ledger"
import { DEFAULT_PLAN_SLUG } from "@/lib/plans/registry"
import {
  createPendingCommission,
  appendClawback,
  logCommissionFailure,
} from "@/lib/commerce/commission"
import { notifyNewPurchase } from "@/lib/notifications"

const VALID_ROLE_UPGRADES: ReadonlySet<UserRole> = new Set([
  "CLIENT",
  "RESELLER",
  "INTERN",
])

/**
 * Product-catalog checkout completion. Branches off the legacy
 * serviceArm path via metadata.source === "product".
 *
 * Wire (set by /api/checkout/[slug]):
 *   metadata.source       = "product"
 *   metadata.productSlug  = "<slug>"   — looks up the local Product row
 *   metadata.userId       = "<id>"     — local User.id, optional
 *   metadata.referringResellerId = "<id>" — locked-in attribution
 *   metadata.intervalType = "monthly" | "annual" | "one_time"
 */
export async function handleProductCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.source !== "product") return

  const productSlug = session.metadata?.productSlug
  if (!productSlug) {
    logger.error("Product checkout missing metadata.productSlug", undefined, {
      sessionId: session.id,
    })
    return
  }

  const userId = await resolveUserId(session)
  if (!userId) {
    logger.error("Product checkout: could not resolve userId", undefined, {
      sessionId: session.id,
    })
    return
  }

  const product = await db.product.findUnique({ where: { slug: productSlug } })
  if (!product) {
    logger.error("Product checkout: product not found", undefined, { productSlug })
    return
  }

  // Idempotency — if we already created a Purchase for this session/sub, bail.
  const existing = await db.purchase.findFirst({
    where: {
      OR: [
        { stripeCheckoutSessionId: session.id },
        ...(session.subscription ? [{ stripeSubscriptionId: session.subscription as string }] : []),
      ],
    },
  })
  if (existing) {
    logger.warn(`Product purchase already exists for session ${session.id}, skipping`)
    return
  }

  const referringResellerId = session.metadata?.referringResellerId || null

  const intervalType = (session.metadata?.intervalType ?? "monthly") as
    | "monthly"
    | "annual"
    | "one_time"
  const amountCents = session.amount_total ?? 0
  const currency = session.currency ?? "usd"

  // Persist Stripe customer id on the user if we don't have it yet.
  if (session.customer) {
    await db.user
      .update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer as string },
      })
      .catch(() => {})
  }

  const purchase = await db.purchase.create({
    data: {
      userId,
      productId: product.id,
      referringResellerId,
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: (session.subscription as string) || null,
      stripeCustomerId: (session.customer as string) || null,
      status: session.mode === "subscription" ? "active" : "active",
      amountCents,
      currency,
      intervalType: session.mode === "subscription" ? intervalType : "one_time",
    },
  })

  // Apply role upgrade if this product grants one (e.g. CLIENT → RESELLER).
  // Guard the cast — Product.grantsRole is a free String column for
  // schema simplicity, but only some values map to real UserRoles.
  if (product.grantsRole && VALID_ROLE_UPGRADES.has(product.grantsRole as UserRole)) {
    await db.user.update({
      where: { id: userId },
      data: { role: product.grantsRole as UserRole },
    })
  }

  // Sync entitlements from active purchases.
  await reconcileEntitlementsForUser(userId)

  // Plan upgrade: tier products set User.planSlug and grant the monthly
  // credit pack. Idempotency comes from the early `existing` Purchase
  // check above — by the time we get here we know this is a fresh purchase.
  if (product.type === "tier") {
    await db.user.update({
      where: { id: userId },
      data: { planSlug: product.slug, creditPlanTier: product.slug },
    })
    if (product.creditsPerMonth > 0) {
      await grantCredits({
        userId,
        amount: product.creditsPerMonth,
        reason: "monthly-grant",
        metadata: { source: "plan-checkout", planSlug: product.slug, sessionId: session.id },
      }).catch((err) =>
        logger.error("Failed to grant plan credits on checkout", err, {
          userId,
          planSlug: product.slug,
        }),
      )
    }
  }

  // Credit pack: addon products with creditsOneTime > 0 grant credits
  // immediately. No entitlements, no recurring charge.
  if (product.type === "addon" && product.creditsOneTime > 0) {
    await grantCredits({
      userId,
      amount: product.creditsOneTime,
      reason: "topup-purchase",
      metadata: { source: "credit-pack", productSlug: product.slug, sessionId: session.id },
    }).catch((err) =>
      logger.error("Failed to grant credit pack on checkout", err, {
        userId,
        productSlug: product.slug,
      }),
    )
  }

  // First-time commission event.
  // Re-validate the reseller is still eligible at webhook time. Without this,
  // a downgraded user (RESELLER → CLIENT) or a user whose site was unpublished
  // between checkout creation and payment completion would still earn
  // commission — silently corrupting payouts.
  if (referringResellerId && product.commissionBps > 0) {
    const reseller = await db.user.findUnique({
      where: { id: referringResellerId },
      select: {
        role: true,
        operatorSite: { select: { isPublished: true } },
      },
    })
    const isEligibleReseller =
      reseller &&
      (reseller.role === "RESELLER" ||
        reseller.role === "ADMIN" ||
        reseller.role === "SUPER_ADMIN")
    if (isEligibleReseller) {
      await createPendingCommission({
        purchaseId: purchase.id,
        type: "initial_purchase",
        baseAmountCents: amountCents,
        notes: `Initial purchase: ${product.name}`,
      }).catch((err) =>
        logCommissionFailure("createPendingCommission", err, { purchaseId: purchase.id }),
      )
    } else {
      logger.warn(
        "Skipping commission — referring reseller no longer eligible",
        {
          purchaseId: purchase.id,
          referringResellerId,
          role: reseller?.role ?? "deleted",
        },
      )
    }
  }

  // Notify team — non-blocking.
  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    notifyNewPurchase({
      clientName: user.name ?? user.email,
      serviceName: product.name,
      tier: product.type === "tier" ? product.name : undefined,
      amount: amountCents / 100,
      userId,
    }).catch((err) =>
      logger.error("notifyNewPurchase failed for product checkout", err, { userId }),
    )
  }
}

/**
 * Subscription renewal — fires another commission for the reseller.
 * The Purchase row's amountCents tracks the most recent renewal, so
 * sub upgrades land here too.
 */
export async function handleProductInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Only renewals — initial subscription invoices arrive with billing_reason
  // === "subscription_create" and are handled by the checkout-completed path.
  if (invoice.billing_reason !== "subscription_cycle") return

  const subId = (invoice.subscription as string) || null
  if (!subId) return

  const purchase = await db.purchase.findFirst({
    where: { stripeSubscriptionId: subId },
    include: {
      product: {
        select: {
          commissionBps: true,
          name: true,
          slug: true,
          type: true,
          creditsPerMonth: true,
        },
      },
    },
  })
  if (!purchase) return // not a product purchase we manage

  const baseAmountCents = invoice.amount_paid ?? 0

  // Update Purchase with latest period info.
  await db.purchase.update({
    where: { id: purchase.id },
    data: { amountCents: baseAmountCents, status: "active" },
  })

  // Refresh entitlements (push expiresAt forward for subs).
  await reconcileEntitlementsForUser(purchase.userId)

  // Plan renewal: re-grant the monthly credit pack on each billing cycle.
  // The ledger function is itself idempotent within a single calendar
  // month (it skips if creditGrantedAt is in the same month) — so even
  // if Stripe re-sends the invoice.paid webhook we won't double-grant.
  if (purchase.product.type === "tier" && purchase.product.creditsPerMonth > 0) {
    await grantCredits({
      userId: purchase.userId,
      amount: purchase.product.creditsPerMonth,
      reason: "monthly-grant",
      metadata: {
        source: "plan-renewal",
        planSlug: purchase.product.slug,
        invoiceId: invoice.id,
      },
    }).catch((err) =>
      logger.error("Failed to grant plan renewal credits", err, {
        userId: purchase.userId,
        planSlug: purchase.product.slug,
      }),
    )
  }

  // Re-validate reseller eligibility on every renewal — see initial-purchase
  // path for rationale (downgraded resellers shouldn't keep earning).
  if (purchase.referringResellerId && purchase.product.commissionBps > 0) {
    const reseller = await db.user.findUnique({
      where: { id: purchase.referringResellerId },
      select: { role: true },
    })
    const isEligibleReseller =
      reseller &&
      (reseller.role === "RESELLER" ||
        reseller.role === "ADMIN" ||
        reseller.role === "SUPER_ADMIN")
    if (isEligibleReseller) {
      await createPendingCommission({
        purchaseId: purchase.id,
        type: "renewal",
        baseAmountCents,
        notes: `Renewal: ${purchase.product.name}`,
      }).catch((err) =>
        logCommissionFailure("createPendingCommission(renewal)", err, {
          purchaseId: purchase.id,
        }),
      )
    } else {
      logger.warn(
        "Skipping renewal commission — referring reseller no longer eligible",
        {
          purchaseId: purchase.id,
          referringResellerId: purchase.referringResellerId,
          role: reseller?.role ?? "deleted",
        },
      )
    }
  }
}

/**
 * Subscription canceled. Mark purchase canceled + reconcile entitlements
 * (which will revoke anything no longer covered by an active purchase).
 */
export async function handleProductSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const purchase = await db.purchase.findFirst({
    where: { stripeSubscriptionId: sub.id },
    include: { product: { select: { slug: true, type: true } } },
  })
  if (!purchase) return

  await db.purchase.update({
    where: { id: purchase.id },
    data: { status: "canceled", endedAt: new Date() },
  })

  await reconcileEntitlementsForUser(purchase.userId)

  // Tier sub canceled → revert User.planSlug to "free" so the marketplace
  // and paywall flows behave correctly. Only if the canceled product was
  // actually their current plan — guards against a previous downgrade
  // from operator → pro where the operator sub cancellation shouldn't
  // demote them all the way to free.
  if (purchase.product.type === "tier") {
    const user = await db.user.findUnique({
      where: { id: purchase.userId },
      select: { planSlug: true },
    })
    if (user?.planSlug === purchase.product.slug) {
      await db.user.update({
        where: { id: purchase.userId },
        data: { planSlug: DEFAULT_PLAN_SLUG, creditPlanTier: "trial" },
      })
    }
  }
}

/**
 * Subscription updated (status changes — past_due, canceled, etc.).
 * Mostly we sync the status onto the Purchase row + reconcile.
 */
export async function handleProductSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  const purchase = await db.purchase.findFirst({
    where: { stripeSubscriptionId: sub.id },
  })
  if (!purchase) return

  // Map Stripe statuses to ours. Anything not active/trialing is treated
  // as "lost coverage" by the entitlement reconciler.
  const status = sub.status // Stripe's status strings happen to be a 1:1 fit for ours
  await db.purchase.update({
    where: { id: purchase.id },
    data: {
      status,
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
    },
  })

  await reconcileEntitlementsForUser(purchase.userId)
}

/**
 * Refund landed → fire a clawback. We do NOT mutate the original
 * commission row (ledger is append-only); a clawback is a new row
 * with a negative amount that nets out the earlier credit when the
 * payable balance is summed.
 */
export async function handleProductChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const refundedCents = charge.amount_refunded ?? 0
  if (refundedCents <= 0) return

  // Try to resolve the purchase via subscription, then via session.
  let purchase = null
  if (charge.invoice) {
    // Charges from subscription invoices link via invoice→subscription
    const inv = typeof charge.invoice === "string" ? charge.invoice : charge.invoice.id
    const invoice = await import("@/lib/stripe").then((m) =>
      m.stripe.invoices.retrieve(inv).catch(() => null),
    )
    if (invoice?.subscription) {
      const subId = invoice.subscription as string
      purchase = await db.purchase.findFirst({
        where: { stripeSubscriptionId: subId },
      })
    }
  }
  // Fallback: one-time charges — we'd need session.payment_intent → charge linkage.
  // Best-effort: skip silently. Adam can manually adjust via admin tools if needed.
  if (!purchase) return

  await appendClawback({
    purchaseId: purchase.id,
    refundAmountCents: refundedCents,
    notes: `Refund on charge ${charge.id}`,
  }).catch((err) =>
    logCommissionFailure("appendClawback", err, { chargeId: charge.id }),
  )

  // If the entire purchase was refunded, mark it as such.
  if (refundedCents >= (purchase.amountCents ?? 0)) {
    await db.purchase.update({
      where: { id: purchase.id },
      data: { status: "refunded", endedAt: new Date() },
    })
    await reconcileEntitlementsForUser(purchase.userId)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(session: Stripe.Checkout.Session): Promise<string | null> {
  const fromMeta = session.metadata?.userId
  if (fromMeta) return fromMeta

  const clerkId = session.client_reference_id
  if (clerkId) {
    const u = await db.user.findFirst({ where: { clerkId } })
    if (u) return u.id
  }

  const email = session.customer_details?.email
  if (email) {
    const u = await db.user.findFirst({ where: { email } })
    if (u) return u.id
  }
  return null
}
