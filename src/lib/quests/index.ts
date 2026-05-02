/**
 * Quest System — runtime helpers
 *
 * Public API:
 *  - markQuestEvent(userId, event, ctx?)  → call from API routes / triggers
 *  - getUserProgress(userId)              → for /quests page + dashboard widget
 *  - isFeatureUnlocked(userId, feature)   → for nav/feature gates
 *  - getNextQuest(userId)                 → the single "what to do next" hint
 *  - claimReward(userId, questKey)        → user-initiated reward redemption
 *  - recordDailyLogin(userId)             → streak tracking
 *
 * Everything is idempotent and non-blocking. Quest tracking must NEVER break
 * the parent action — wrap all calls from triggers in `.catch()`.
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import {
  ALWAYS_AVAILABLE_FEATURES,
  FEATURE_KEYS,
  QUESTS,
  TOTAL_TIERS,
  getMainQuests,
  getQuest,
  getQuestsByEvent,
  type FeatureKey,
  type QuestDef,
  type TriggerEvent,
} from "./registry"
import type { Prisma, QuestStatus, UserQuest } from "@prisma/client"

// ===================================================================
// Event tracking — called from API routes when user does something
// ===================================================================

/**
 * Record that an event happened for a user. Increments progress on any
 * quest watching this event; auto-completes when goal is reached.
 *
 * Idempotent: completing an already-completed quest is a no-op.
 *
 * NEVER throws — silently logs and returns null on failure so callers
 * can drop this in without try/catch.
 */
export async function markQuestEvent(
  userId: string,
  event: TriggerEvent,
  ctx?: { increment?: number; metadata?: Record<string, unknown> },
): Promise<UserQuest[] | null> {
  try {
    const quests = getQuestsByEvent(event)
    if (quests.length === 0) return []

    const inc = ctx?.increment ?? 1
    const out: UserQuest[] = []

    for (const quest of quests) {
      const result = await advanceQuest(userId, quest, inc, ctx?.metadata)
      if (result) out.push(result)
    }
    return out
  } catch (err) {
    logger.error("markQuestEvent failed", err, { userId, event })
    return null
  }
}

/**
 * Internal — advance a single quest by `inc` toward its goal.
 * Auto-completes if progress crosses goal. Auto-claims if quest is autoClaim.
 * Idempotent (returns existing CLAIMED/COMPLETED row unchanged).
 */
async function advanceQuest(
  userId: string,
  quest: QuestDef,
  inc: number,
  metadata?: Record<string, unknown>,
): Promise<UserQuest | null> {
  const existing = await db.userQuest.findUnique({
    where: { userId_questKey: { userId, questKey: quest.key } },
  })

  // Already done — don't double-credit.
  if (existing && (existing.status === "COMPLETED" || existing.status === "CLAIMED")) {
    return existing
  }

  const goal = quest.goal ?? 1
  const prevProgress = existing?.progress ?? 0
  const newProgress = Math.min(prevProgress + inc, goal)
  const isComplete = newProgress >= goal

  // First time we see this quest — check prerequisites.
  if (!existing) {
    const ok = await prerequisitesMet(userId, quest)
    if (!ok) {
      // Lock it; we'll unlock when prereqs clear.
      return db.userQuest.create({
        data: {
          userId,
          questKey: quest.key,
          status: "LOCKED",
          progress: 0,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      })
    }
  }

  const status: QuestStatus = isComplete
    ? quest.autoClaim
      ? "CLAIMED"
      : "COMPLETED"
    : "IN_PROGRESS"

  const updated = await db.userQuest.upsert({
    where: { userId_questKey: { userId, questKey: quest.key } },
    create: {
      userId,
      questKey: quest.key,
      status,
      progress: newProgress,
      startedAt: new Date(),
      completedAt: isComplete ? new Date() : null,
      claimedAt: isComplete && quest.autoClaim ? new Date() : null,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
    update: {
      status,
      progress: newProgress,
      startedAt: existing?.startedAt ?? new Date(),
      completedAt: isComplete ? existing?.completedAt ?? new Date() : null,
      claimedAt: isComplete && quest.autoClaim ? new Date() : null,
    },
  })

  // Newly completed — fire side effects (notification, XP, auto-claim rewards).
  const justCompleted =
    isComplete &&
    (!existing ||
      (existing.status !== "COMPLETED" && existing.status !== "CLAIMED"))

  if (justCompleted) {
    await onQuestCompleted(userId, quest, updated)
  }
  return updated
}

async function prerequisitesMet(userId: string, quest: QuestDef): Promise<boolean> {
  if (!quest.prerequisiteKeys || quest.prerequisiteKeys.length === 0) return true
  const done = await db.userQuest.count({
    where: {
      userId,
      questKey: { in: quest.prerequisiteKeys },
      status: { in: ["COMPLETED", "CLAIMED"] },
    },
  })
  return done === quest.prerequisiteKeys.length
}

// ===================================================================
// Side effects on quest completion
// ===================================================================

async function onQuestCompleted(
  userId: string,
  quest: QuestDef,
  _row: UserQuest,
): Promise<void> {
  // Award XP & credits immediately (these aren't gated by claim — claim is
  // just the celebration moment for non-auto-claim quests).
  const credits = quest.creditReward
  const xp = quest.xpReward

  // If autoClaim, grant credits NOW. Otherwise wait for claimReward().
  if (quest.autoClaim) {
    await grantRewards(userId, quest)
  } else {
    // Always grant XP on completion regardless of claim state — XP is the
    // top-line metric, credits are the redeemable carrot.
    await db.user.update({
      where: { id: userId },
      data: { totalXp: { increment: xp } },
    })
  }

  // Maybe level up — questLevel is the highest tier where every main quest
  // in that tier and below is COMPLETED+.
  await maybeLevelUp(userId)

  // Newly available quests — flip LOCKED → AVAILABLE for any quest whose
  // prereqs are now satisfied.
  await unlockReadyQuests(userId)

  // In-app celebration. Best-effort.
  await notify({
    type: "quest_completed",
    title: `Unlocked: ${quest.title}`,
    message: quest.autoClaim
      ? `+${xp} XP · +${credits} credits`
      : `Tap your dashboard to claim +${xp} XP and +${credits} credits.`,
    channel: "IN_APP",
    userId,
    metadata: {
      questKey: quest.key,
      tier: quest.tier ?? null,
      category: quest.category,
      unlocksFeatureKey: quest.unlocksFeatureKey ?? null,
      badgeKey: quest.badgeKey ?? null,
      hasMysteryBox: quest.hasMysteryBox ?? false,
    },
  }).catch((err) => logger.error("quest notify failed", err))

  // Operator event log (for admin observability).
  logger.info("Quest completed", {
    userId,
    questKey: quest.key,
    tier: quest.tier,
    category: quest.category,
  })
}

/**
 * Apply rewards: credits, badge, mystery-box bonus.
 * Called either inline (autoClaim) or via claimReward().
 */
async function grantRewards(userId: string, quest: QuestDef): Promise<{
  credits: number
  xp: number
  mysteryBoxCredits: number
  badgeAwarded: string | null
}> {
  let mysteryBoxCredits = 0
  if (quest.hasMysteryBox) {
    // Variable reward — 10–50 credits, weighted toward the lower end.
    const r = Math.random()
    mysteryBoxCredits = r < 0.6 ? 10 : r < 0.9 ? 25 : 50
  }

  const totalCredits = quest.creditReward + mysteryBoxCredits

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      creditBalance: { increment: totalCredits },
      totalXp: { increment: quest.xpReward },
    },
    select: { creditBalance: true },
  })

  // Credit ledger entry — best effort.
  try {
    await db.creditTransaction.create({
      data: {
        userId,
        amount: totalCredits,
        balanceAfter: updatedUser.creditBalance,
        reason: "quest-reward",
        metadata: {
          questKey: quest.key,
          questTitle: quest.title,
          mysteryBoxCredits,
        },
      },
    })
  } catch (err) {
    logger.error("CreditTransaction create failed", err, {
      userId,
      questKey: quest.key,
    })
  }

  let badgeAwarded: string | null = null
  if (quest.badgeKey) {
    try {
      await db.userBadge.upsert({
        where: { userId_badgeKey: { userId, badgeKey: quest.badgeKey } },
        create: { userId, badgeKey: quest.badgeKey },
        update: {},
      })
      badgeAwarded = quest.badgeKey
    } catch (err) {
      logger.error("badge upsert failed", err, { userId, badgeKey: quest.badgeKey })
    }
  }

  return {
    credits: quest.creditReward,
    xp: quest.xpReward,
    mysteryBoxCredits,
    badgeAwarded,
  }
}

/** Flip LOCKED → AVAILABLE for any quest whose prereqs are now satisfied. */
async function unlockReadyQuests(userId: string): Promise<void> {
  const locked = await db.userQuest.findMany({
    where: { userId, status: "LOCKED" },
  })

  for (const row of locked) {
    const quest = getQuest(row.questKey)
    if (!quest) continue
    const ok = await prerequisitesMet(userId, quest)
    if (ok) {
      await db.userQuest.update({
        where: { id: row.id },
        data: { status: "AVAILABLE" },
      })
    }
  }

  // Also: there may be quests we've never written a row for that have *no*
  // prereqs and are ready. We don't pre-create those; they get created on
  // first event. That's fine.
}

async function maybeLevelUp(userId: string): Promise<void> {
  // questLevel = highest tier where 100% of MAIN quests in that tier are done.
  const allMain = getMainQuests()
  const userQuests = await db.userQuest.findMany({
    where: {
      userId,
      questKey: { in: allMain.map((q) => q.key) },
      status: { in: ["COMPLETED", "CLAIMED"] },
    },
    select: { questKey: true },
  })
  const doneSet = new Set(userQuests.map((u) => u.questKey))

  let level = -1
  for (let tier = 0; tier < TOTAL_TIERS; tier++) {
    const inTier = allMain.filter((q) => q.tier === tier)
    if (inTier.length === 0) continue
    const allDone = inTier.every((q) => doneSet.has(q.key))
    if (allDone) level = tier
    else break
  }
  const newLevel = Math.max(level + 1, 0) // 0..TOTAL_TIERS
  // questLevel of N means "graduated tier N-1, working on tier N"
  await db.user.update({
    where: { id: userId },
    data: { questLevel: Math.min(newLevel, TOTAL_TIERS) },
  })
}

// ===================================================================
// User-facing read API
// ===================================================================

export interface QuestRow {
  key: string
  title: string
  description: string
  shortHint?: string
  category: QuestDef["category"]
  tier?: number
  status: QuestStatus | "AVAILABLE_NEW" // AVAILABLE_NEW = no row yet but unlockable
  progress: number
  goal: number
  xpReward: number
  creditReward: number
  badgeKey?: string
  hasMysteryBox?: boolean
  iconName?: string
  unlocksFeatureKey?: FeatureKey
  prerequisiteKeys?: string[]
  prerequisiteTitles?: string[]
}

export interface UserProgress {
  totalXp: number
  questLevel: number
  totalTiers: number
  completedCount: number
  totalMainCount: number
  pctToNextUnlock: number // 0–100
  nextQuest: QuestRow | null
  byCategory: {
    main: QuestRow[]
    side: QuestRow[]
    hidden: QuestRow[] // only includes earned hidden quests
  }
  badges: { key: string; earnedAt: Date }[]
  streak: { current: number; longest: number; totalActiveDays: number } | null
}

export async function getUserProgress(userId: string): Promise<UserProgress> {
  const [user, rows, badges, streak] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, questLevel: true },
    }),
    db.userQuest.findMany({ where: { userId } }),
    db.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
    }),
    db.userStreak.findUnique({ where: { userId } }),
  ])

  const rowsByKey: Record<string, UserQuest> = Object.fromEntries(
    rows.map((r) => [r.questKey, r]),
  )

  const decorate = (q: QuestDef): QuestRow => {
    const row = rowsByKey[q.key]
    let status: QuestRow["status"]
    if (!row) {
      // No row yet — derive from prereqs synchronously (we can't async-check
      // here; we already have rowsByKey, so compute from that).
      const prereqsOk =
        !q.prerequisiteKeys ||
        q.prerequisiteKeys.length === 0 ||
        q.prerequisiteKeys.every((k) => {
          const r = rowsByKey[k]
          return r?.status === "COMPLETED" || r?.status === "CLAIMED"
        })
      status = prereqsOk ? "AVAILABLE_NEW" : "LOCKED"
    } else {
      status = row.status
    }
    return {
      key: q.key,
      title: q.title,
      description: q.description,
      shortHint: q.shortHint,
      category: q.category,
      tier: q.tier,
      status,
      progress: row?.progress ?? 0,
      goal: q.goal ?? 1,
      xpReward: q.xpReward,
      creditReward: q.creditReward,
      badgeKey: q.badgeKey,
      hasMysteryBox: q.hasMysteryBox,
      iconName: q.iconName,
      unlocksFeatureKey: q.unlocksFeatureKey,
      prerequisiteKeys: q.prerequisiteKeys,
      prerequisiteTitles: q.prerequisiteKeys?.map(
        (k) => getQuest(k)?.title ?? k,
      ),
    }
  }

  const main = QUESTS.filter((q) => q.category === "MAIN")
    .map(decorate)
    .sort((a, b) => {
      if ((a.tier ?? 0) !== (b.tier ?? 0)) return (a.tier ?? 0) - (b.tier ?? 0)
      const aq = getQuest(a.key)
      const bq = getQuest(b.key)
      return (aq?.order ?? 0) - (bq?.order ?? 0)
    })
  const side = QUESTS.filter((q) => q.category === "SIDE").map(decorate)
  // Hidden quests: only show if started or completed.
  const hidden = QUESTS.filter((q) => q.category === "HIDDEN")
    .map(decorate)
    .filter((q) => q.status !== "AVAILABLE_NEW" && q.status !== "LOCKED")

  const completedCount = main.filter(
    (q) => q.status === "COMPLETED" || q.status === "CLAIMED",
  ).length
  const totalMainCount = main.length

  // % to next unlock = within current tier, how many of those quests are done?
  const currentTier = user?.questLevel ?? 0
  const tierQuests = main.filter((q) => q.tier === currentTier)
  const tierDone = tierQuests.filter(
    (q) => q.status === "COMPLETED" || q.status === "CLAIMED",
  ).length
  const pctToNextUnlock =
    tierQuests.length === 0
      ? 100
      : Math.round((tierDone / tierQuests.length) * 100)

  // Pick nextQuest: first AVAILABLE / IN_PROGRESS / AVAILABLE_NEW main quest
  // in the lowest tier the user hasn't finished.
  const nextQuest =
    main.find(
      (q) =>
        q.status === "IN_PROGRESS" ||
        q.status === "AVAILABLE" ||
        q.status === "AVAILABLE_NEW",
    ) ?? null

  return {
    totalXp: user?.totalXp ?? 0,
    questLevel: user?.questLevel ?? 0,
    totalTiers: TOTAL_TIERS,
    completedCount,
    totalMainCount,
    pctToNextUnlock,
    nextQuest,
    byCategory: { main, side, hidden },
    badges: badges.map((b) => ({ key: b.badgeKey, earnedAt: b.earnedAt })),
    streak: streak
      ? {
          current: streak.currentDays,
          longest: streak.longestDays,
          totalActiveDays: streak.totalActiveDays,
        }
      : null,
  }
}

// ===================================================================
// Feature gates
// ===================================================================

/**
 * Whether a feature is unlocked for a user. Admins/super-admins always pass.
 * Existing paying customers get a grandfather flag (see backfill).
 *
 * A feature is unlocked when ALL gating quests are COMPLETED+ — but in
 * practice we only gate features behind ONE quest (see registry), so this
 * is a single check. We still treat "all" semantics for future-proofing.
 */
export async function isFeatureUnlocked(
  userId: string,
  feature: FeatureKey,
): Promise<boolean> {
  if (ALWAYS_AVAILABLE_FEATURES.includes(feature)) return true

  // Admins always unlocked.
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user) return false
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true

  const gatingQuests = QUESTS.filter((q) => q.unlocksFeatureKey === feature)
  if (gatingQuests.length === 0) return true // not gated

  const done = await db.userQuest.count({
    where: {
      userId,
      questKey: { in: gatingQuests.map((q) => q.key) },
      status: { in: ["COMPLETED", "CLAIMED"] },
    },
  })
  return done >= gatingQuests.length
}

/** Bulk version — for client-side feature flag map. */
export async function getFeatureUnlockMap(
  userId: string,
): Promise<Record<FeatureKey, boolean>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  const completed = await db.userQuest.findMany({
    where: { userId, status: { in: ["COMPLETED", "CLAIMED"] } },
    select: { questKey: true },
  })
  const doneSet = new Set(completed.map((c) => c.questKey))

  const map = {} as Record<FeatureKey, boolean>
  for (const feature of FEATURE_KEYS) {
    if (isAdmin || ALWAYS_AVAILABLE_FEATURES.includes(feature)) {
      map[feature] = true
      continue
    }
    const gating = QUESTS.filter((q) => q.unlocksFeatureKey === feature)
    if (gating.length === 0) {
      map[feature] = true
      continue
    }
    map[feature] = gating.every((q) => doneSet.has(q.key))
  }
  return map
}

// ===================================================================
// Claim
// ===================================================================

export async function claimReward(
  userId: string,
  questKey: string,
): Promise<{
  ok: boolean
  alreadyClaimed?: boolean
  reason?: string
  reward?: {
    credits: number
    xp: number
    mysteryBoxCredits: number
    badgeAwarded: string | null
  }
}> {
  const quest = getQuest(questKey)
  if (!quest) return { ok: false, reason: "unknown quest" }

  const row = await db.userQuest.findUnique({
    where: { userId_questKey: { userId, questKey } },
  })
  if (!row) return { ok: false, reason: "not started" }
  if (row.status === "CLAIMED")
    return { ok: true, alreadyClaimed: true }
  if (row.status !== "COMPLETED")
    return { ok: false, reason: "not yet completed" }

  const reward = await grantRewards(userId, quest)
  await db.userQuest.update({
    where: { id: row.id },
    data: {
      status: "CLAIMED",
      claimedAt: new Date(),
      rewardPayload: reward as unknown as Prisma.InputJsonValue,
    },
  })
  return { ok: true, reward }
}

// ===================================================================
// Streak tracking
// ===================================================================

/**
 * Idempotently increment the user's login streak. Call from middleware /
 * dashboard server-component on each visit. Resets if more than 1 calendar
 * day has elapsed.
 */
export async function recordDailyLogin(userId: string): Promise<void> {
  try {
    const today = startOfDay(new Date())
    const existing = await db.userStreak.findUnique({ where: { userId } })

    if (!existing) {
      await db.userStreak.create({
        data: {
          userId,
          currentDays: 1,
          longestDays: 1,
          totalActiveDays: 1,
          lastActiveDate: today,
        },
      })
      // Time-of-day hidden quests
      await checkTimeOfDayQuests(userId)
      return
    }

    const last = startOfDay(existing.lastActiveDate)
    const dayDiff = Math.round(
      (today.getTime() - last.getTime()) / 86_400_000,
    )

    if (dayDiff === 0) return // already counted today

    let current = existing.currentDays
    if (dayDiff === 1) current += 1
    else current = 1 // reset

    const longest = Math.max(existing.longestDays, current)
    await db.userStreak.update({
      where: { userId },
      data: {
        currentDays: current,
        longestDays: longest,
        totalActiveDays: existing.totalActiveDays + 1,
        lastActiveDate: today,
      },
    })

    await checkTimeOfDayQuests(userId)
  } catch (err) {
    logger.error("recordDailyLogin failed", err, { userId })
  }
}

async function checkTimeOfDayQuests(userId: string): Promise<void> {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 5) {
    await advanceHidden(userId, "night_owl")
  } else if (hour >= 5 && hour < 7) {
    await advanceHidden(userId, "early_bird")
  }
}

async function advanceHidden(userId: string, questKey: string): Promise<void> {
  const quest = getQuest(questKey)
  if (!quest) return
  await advanceQuest(userId, quest, 1).catch((err) =>
    logger.error("hidden quest advance failed", err, { userId, questKey }),
  )
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// ===================================================================
// Endowed-progress seeding for new signups
// ===================================================================

/**
 * Auto-credit a newly-signed-up user with the Day-0 quests so they don't
 * stare at a 0% progress bar. Fires the welcome / first_steps quests.
 *
 * Call once from the signup webhook OR lazily from the dashboard.
 */
export async function seedDayZero(userId: string): Promise<void> {
  await markQuestEvent(userId, "user.signed_up").catch((err) =>
    logger.error("seedDayZero failed", err, { userId }),
  )
}
