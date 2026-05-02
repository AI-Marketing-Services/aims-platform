/**
 * One-shot: backfill quest progress for existing users so we don't suddenly
 * lock features they're already using.
 *
 * For every existing user, infers which Tier 0–4 main quests they've already
 * earned based on real activity (deals, audits, scripts, invoices, etc.) and
 * inserts UserQuest rows in CLAIMED state. Idempotent — safe to re-run.
 *
 * Run:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/backfill-quests.ts
 */
import { PrismaClient } from "@prisma/client"
import { QUESTS } from "../src/lib/quests/registry"

const db = new PrismaClient()

interface UserSnapshot {
  id: string
  email: string
  memberProfileFilledOut: boolean
  hasContact: boolean
  hasAudit: boolean
  hasScript: boolean
  hasFollowUpRule: boolean
  hasContent: boolean
  hasInvoiceSent: boolean
  hasProposal: boolean
  hasMarketplaceSubscription: boolean
  hasCompletedDeal: boolean
  hasReferral: boolean
}

async function loadSnapshots(): Promise<UserSnapshot[]> {
  const users = await db.user.findMany({
    select: { id: true, email: true },
  })

  const snapshots: UserSnapshot[] = []
  for (const u of users) {
    const [
      profile,
      contact,
      audit,
      script,
      rule,
      content,
      sentInvoice,
      proposal,
      sub,
      activeDeal,
      ref,
    ] = await Promise.all([
      db.memberProfile.findUnique({
        where: { userId: u.id },
        select: { businessName: true, niche: true, oneLiner: true },
      }),
      db.clientContact
        .findFirst({ where: { clientDeal: { userId: u.id } }, select: { id: true } })
        .catch(() => null),
      db.auditQuiz
        .findFirst({ where: { ownerId: u.id }, select: { id: true } })
        .catch(() => null),
      db.aiScript
        .findFirst({ where: { userId: u.id }, select: { id: true } })
        .catch(() => null),
      db.followUpRule
        .findFirst({ where: { userId: u.id }, select: { id: true } })
        .catch(() => null),
      db.contentPiece
        .findFirst({ where: { userId: u.id }, select: { id: true } })
        .catch(() => null),
      db.clientInvoice
        .findFirst({
          where: { userId: u.id, status: { in: ["SENT", "PAID", "OVERDUE"] } },
          select: { id: true },
        })
        .catch(() => null),
      db.clientProposal
        .findFirst({
          where: { clientDeal: { userId: u.id } },
          select: { id: true },
        })
        .catch(() => null),
      db.subscription
        .findFirst({
          where: { userId: u.id, status: { in: ["ACTIVE", "TRIALING"] } },
          select: { id: true },
        })
        .catch(() => null),
      db.clientDeal
        .findFirst({
          where: { userId: u.id, stage: { in: ["ACTIVE_RETAINER", "COMPLETED"] } },
          select: { id: true },
        })
        .catch(() => null),
      db.referral
        .findFirst({ where: { referrerId: u.id }, select: { id: true } })
        .catch(() => null),
    ])

    snapshots.push({
      id: u.id,
      email: u.email,
      memberProfileFilledOut: Boolean(
        profile?.businessName && profile?.niche && profile?.oneLiner,
      ),
      hasContact: Boolean(contact),
      hasAudit: Boolean(audit),
      hasScript: Boolean(script),
      hasFollowUpRule: Boolean(rule),
      hasContent: Boolean(content),
      hasInvoiceSent: Boolean(sentInvoice),
      hasProposal: Boolean(proposal),
      hasMarketplaceSubscription: Boolean(sub),
      hasCompletedDeal: Boolean(activeDeal),
      hasReferral: Boolean(ref),
    })
  }
  return snapshots
}

const KEY_TO_PREDICATE: Record<string, (s: UserSnapshot) => boolean> = {
  // Day 0 — credit everyone
  welcome_aboard: () => true,
  first_steps: () => true,
  lay_of_the_land: () => true,
  // Foundation — credit anyone who has actual platform engagement
  operator_profile_complete: (s) => s.memberProfileFilledOut,
  introduce_yourself: () => false, // requires Mighty signal — leave for fresh
  pick_your_lane: (s) => s.memberProfileFilledOut, // proxy
  meet_your_copilot: (s) =>
    s.hasScript || s.hasContent || s.hasProposal,
  // Activation
  first_lead: (s) => s.hasContact,
  first_audit: (s) => s.hasAudit,
  first_script: (s) => s.hasScript,
  show_up: () => false, // can't infer reliably
  // Revenue
  first_proposal: (s) => s.hasProposal,
  first_invoice_sent: (s) => s.hasInvoiceSent,
  first_marketplace_use: (s) => s.hasMarketplaceSubscription,
  lead_scout_apprentice: () => false, // no clean ledger, leave fresh
  // Mastery
  first_follow_up: (s) => s.hasFollowUpRule,
  first_closed_deal: (s) => s.hasCompletedDeal,
  first_content: (s) => s.hasContent,
  first_referral: (s) => s.hasReferral,
}

async function main() {
  process.stdout.write("Loading user snapshots...\n")
  const snapshots = await loadSnapshots()
  process.stdout.write(`Loaded ${snapshots.length} users.\n\n`)

  const mainAndSide = QUESTS.filter((q) => q.category === "MAIN")

  let totalInserted = 0
  let totalUpdated = 0
  for (const snap of snapshots) {
    const earned: string[] = []
    for (const quest of mainAndSide) {
      const predicate = KEY_TO_PREDICATE[quest.key]
      if (!predicate) continue
      if (!predicate(snap)) continue
      earned.push(quest.key)
    }

    if (earned.length === 0) continue

    for (const key of earned) {
      const quest = mainAndSide.find((q) => q.key === key)
      if (!quest) continue
      const result = await db.userQuest.upsert({
        where: { userId_questKey: { userId: snap.id, questKey: key } },
        create: {
          userId: snap.id,
          questKey: key,
          status: "CLAIMED",
          progress: quest.goal ?? 1,
          startedAt: new Date(),
          completedAt: new Date(),
          claimedAt: new Date(),
          metadata: { source: "backfill" },
        },
        update: {
          // If we already have a row, only "level it up" — never demote.
          status: "CLAIMED",
        },
      })
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        totalInserted++
      } else {
        totalUpdated++
      }
    }

    // Compute totalXp + questLevel for the user.
    const totalXp = earned.reduce((sum, key) => {
      const q = mainAndSide.find((m) => m.key === key)
      return sum + (q?.xpReward ?? 0)
    }, 0)

    // questLevel = highest tier where 100% of main quests in that tier are done
    const earnedSet = new Set(earned)
    let level = -1
    for (let tier = 0; tier <= 4; tier++) {
      const inTier = mainAndSide.filter((q) => q.tier === tier)
      if (inTier.length === 0) continue
      const allDone = inTier.every((q) => earnedSet.has(q.key))
      if (allDone) level = tier
      else break
    }

    await db.user.update({
      where: { id: snap.id },
      data: {
        totalXp: Math.max(totalXp, 0),
        questLevel: Math.max(level + 1, 0),
      },
    })

    process.stdout.write(
      `  ✓ ${snap.email}: ${earned.length} quests credited (level ${Math.max(level + 1, 0)})\n`,
    )
  }

  process.stdout.write(`\nDone.\n`)
  process.stdout.write(`  Inserted: ${totalInserted}\n`)
  process.stdout.write(`  Updated:  ${totalUpdated}\n`)
}

main()
  .catch((err) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
