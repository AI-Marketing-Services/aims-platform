/**
 * Credit top-up webhook handler. Listens for checkout.session.completed
 * with metadata.source === "credit-topup" and grants the requested
 * credits via the ledger.
 *
 * Idempotency: dedup on session ID via the CreditTransaction.metadata
 * (we store sessionId there). If a session has already been granted,
 * skip silently. Stripe webhook retries are common and this is the only
 * defence against double-granting.
 */
import type Stripe from "stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { grantCredits } from "@/lib/enrichment/credits/ledger"

export async function handleCreditTopupCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.source !== "credit-topup") return

  const userId = session.metadata.userId
  const creditsRaw = session.metadata.credits
  if (!userId || !creditsRaw) {
    logger.error("Credit topup session missing metadata", null, {
      sessionId: session.id,
      hasUserId: !!userId,
      hasCredits: !!creditsRaw,
    })
    return
  }

  const credits = parseInt(creditsRaw, 10)
  if (!Number.isFinite(credits) || credits <= 0) {
    logger.error("Credit topup session has invalid credits value", null, {
      sessionId: session.id,
      creditsRaw,
    })
    return
  }

  // Idempotency guard — skip if we've already granted this session.
  const existing = await db.creditTransaction.findFirst({
    where: {
      userId,
      reason: "topup-purchase",
      metadata: { path: ["sessionId"], equals: session.id },
    },
    select: { id: true },
  })
  if (existing) {
    logger.info("Credit topup already granted (idempotency hit)", {
      sessionId: session.id,
      userId,
    })
    return
  }

  // Persist Stripe customer ID for future top-ups (so the user doesn't
  // re-enter their card every time).
  if (session.customer && typeof session.customer === "string") {
    await db.user
      .update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      })
      .catch((err) => logger.warn("Couldn't persist stripeCustomerId on topup", { err }))
  }

  await grantCredits({
    userId,
    amount: credits,
    reason: "topup-purchase",
    metadata: {
      sessionId: session.id,
      amountPaidCents: session.amount_total ?? null,
      currency: session.currency ?? "usd",
    },
  })

  logger.info("Credit topup granted", {
    userId,
    credits,
    sessionId: session.id,
    amountPaidCents: session.amount_total,
  })
}
