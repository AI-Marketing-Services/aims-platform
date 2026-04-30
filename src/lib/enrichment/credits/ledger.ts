/**
 * Credit ledger — atomic debit/refund/grant operations on User.creditBalance
 * with paired CreditTransaction records for full audit history.
 *
 * Every mutation runs in a Prisma transaction so balance + ledger entry
 * commit together. A failed insert never silently drops a credit; a
 * failed balance update never leaves an orphan ledger row.
 */
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"
import { PLAN_GRANTS } from "./pricing"

export type LedgerReason =
  | "trial-grant"
  | "monthly-grant"
  | "topup-purchase"
  | "enrichment-debit"
  | "places-search"
  | "refund-error"
  | "admin-adjustment"

export interface LedgerMetadata {
  dealId?: string
  operation?: string
  source?: string
  errorCode?: string
  [key: string]: unknown
}

/**
 * Debit credits from a user. Throws InsufficientCreditsError if the
 * user lacks balance (caller should check via hasBalance() first for
 * better UX). Returns the new balance.
 */
export class InsufficientCreditsError extends Error {
  readonly required: number
  readonly available: number
  constructor(required: number, available: number) {
    super(`Insufficient credits — need ${required}, have ${available}`)
    this.name = "InsufficientCreditsError"
    this.required = required
    this.available = available
  }
}

export async function debitCredits(args: {
  userId: string
  amount: number // positive number (will be stored as negative)
  reason: LedgerReason
  metadata?: LedgerMetadata
}): Promise<{ balanceAfter: number }> {
  if (args.amount <= 0) {
    throw new Error(`debitCredits requires positive amount, got ${args.amount}`)
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: args.userId },
      select: { creditBalance: true },
    })
    if (!user) throw new Error(`User ${args.userId} not found`)
    if (user.creditBalance < args.amount) {
      throw new InsufficientCreditsError(args.amount, user.creditBalance)
    }
    const balanceAfter = user.creditBalance - args.amount
    await tx.user.update({
      where: { id: args.userId },
      data: { creditBalance: balanceAfter },
    })
    await tx.creditTransaction.create({
      data: {
        userId: args.userId,
        amount: -args.amount,
        reason: args.reason,
        metadata: args.metadata as object | undefined,
        balanceAfter,
      },
    })
    return { balanceAfter }
  }).then((result) => {
    void emitEvent({
      actorId: args.userId,
      type: EVENT_TYPES.CREDITS_DEBITED,
      metadata: {
        amount: args.amount,
        reason: args.reason,
        balanceAfter: result.balanceAfter,
        ...(args.metadata ?? {}),
      },
    })
    return result
  })
}

/**
 * Add credits — used for monthly grants, topups, refunds, admin adjustments.
 * Returns new balance.
 */
export async function grantCredits(args: {
  userId: string
  amount: number
  reason: LedgerReason
  metadata?: LedgerMetadata
}): Promise<{ balanceAfter: number }> {
  if (args.amount <= 0) {
    throw new Error(`grantCredits requires positive amount, got ${args.amount}`)
  }
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: args.userId },
      select: { creditBalance: true },
    })
    if (!user) throw new Error(`User ${args.userId} not found`)
    const balanceAfter = user.creditBalance + args.amount
    await tx.user.update({
      where: { id: args.userId },
      data: {
        creditBalance: balanceAfter,
        // Track when the most recent monthly grant fired so the cron
        // can avoid double-granting.
        ...(args.reason === "monthly-grant" ? { creditGrantedAt: new Date() } : {}),
      },
    })
    await tx.creditTransaction.create({
      data: {
        userId: args.userId,
        amount: args.amount,
        reason: args.reason,
        metadata: args.metadata as object | undefined,
        balanceAfter,
      },
    })
    return { balanceAfter }
  }).then((result) => {
    void emitEvent({
      actorId: args.userId,
      type:
        args.reason === "topup-purchase"
          ? EVENT_TYPES.CREDITS_TOPPED_UP
          : EVENT_TYPES.CREDITS_GRANTED,
      metadata: {
        amount: args.amount,
        reason: args.reason,
        balanceAfter: result.balanceAfter,
        ...(args.metadata ?? {}),
      },
    })
    return result
  })
}

/**
 * Cheap check: does the user have enough balance? Use before kicking
 * off an expensive multi-step enrichment so the UI can show a clean
 * "you need more credits" error instead of a partial debit.
 */
export async function hasBalance(userId: string, required: number): Promise<{
  ok: boolean
  current: number
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })
  if (!user) return { ok: false, current: 0 }
  return { ok: user.creditBalance >= required, current: user.creditBalance }
}

/**
 * Monthly grant — refills a user's credits to their plan's grant amount,
 * using the difference. Idempotent within a calendar month — checks
 * `creditGrantedAt` so calling twice doesn't double-grant. Used by the
 * monthly cron.
 */
export async function applyMonthlyGrantIfDue(args: {
  userId: string
  planTier: string
}): Promise<{ granted: number; balanceAfter: number } | null> {
  const grantAmount = PLAN_GRANTS[args.planTier] ?? 0
  if (grantAmount <= 0) return null

  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: { creditGrantedAt: true, creditBalance: true },
  })
  if (!user) return null

  if (user.creditGrantedAt) {
    const last = new Date(user.creditGrantedAt)
    const now = new Date()
    const sameMonth =
      last.getUTCFullYear() === now.getUTCFullYear() &&
      last.getUTCMonth() === now.getUTCMonth()
    if (sameMonth) return null
  }

  const result = await grantCredits({
    userId: args.userId,
    amount: grantAmount,
    reason: "monthly-grant",
    metadata: { planTier: args.planTier },
  })
  logger.info("Applied monthly credit grant", {
    userId: args.userId,
    granted: grantAmount,
    balanceAfter: result.balanceAfter,
  })
  return { granted: grantAmount, balanceAfter: result.balanceAfter }
}
