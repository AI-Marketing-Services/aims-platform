/**
 * Grandfather a plan onto specific users by email — without a Stripe charge.
 *
 * For each email:
 *   - If a User row exists → grant the plan via lib/plans/grant
 *   - If not (Clerk-invited but never logged in) → log + skip; the user
 *     will need to be re-granted after their first sign-in
 *
 * Idempotent — re-running is safe.
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/grandfather-plan.ts
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/grandfather-plan.ts --plan=pro
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/grandfather-plan.ts --emails=adam@x.com,ryan@y.com
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// Default cohort to grandfather. Edit this list as new beta testers come on
// board, or pass --emails=... to override.
const DEFAULT_EMAILS = [
  "adamwolfe102@gmail.com",
  "adamwolfe100@gmail.com",
  "adam@meetcursive.com",
  "ryan@modern-amenities.com",
  "matt@modern-amenities.com",
  "adam@modern-amenities.com",
  // Pre-launch testers — Katie + James are pending Clerk invite. They'll
  // be skipped until they sign in for the first time. Re-run this script
  // after each round of invites.
  "katie@vendingpreneurs.com",
  "katie@kinkead.io",
  "james@aioperatorcollective.com",
]

async function main() {
  // Lazy-import the registry + grant helper so we get clean error messages
  // if the schema is out of sync.
  const { grantPlanToUser } = await import("../src/lib/plans/grant")
  const { getPlan } = await import("../src/lib/plans/registry")

  const emailArg = process.argv.find((a) => a.startsWith("--emails="))
  const planArg = process.argv.find((a) => a.startsWith("--plan="))

  const planSlug = planArg ? planArg.split("=")[1] : "operator"
  const plan = getPlan(planSlug)
  if (!plan) {
    console.error(`[FAIL] Unknown plan: ${planSlug}`)
    process.exit(1)
  }

  const emails = emailArg
    ? emailArg
        .split("=")[1]
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : DEFAULT_EMAILS

  console.log(`Grandfathering ${emails.length} email(s) onto plan "${plan.name}"...\n`)

  let granted = 0
  let missing = 0

  for (const email of emails) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true, planSlug: true },
    })
    if (!user) {
      console.log(`  miss  ${email}  (no User row — invite still pending)`)
      missing++
      continue
    }

    try {
      const result = await grantPlanToUser(user.id, plan.slug, {
        // Don't double-grant credits if they already have plenty — admins
        // and previously-grandfathered users get plan entitlements only.
        skipCredits: false,
        note: "grandfather-plan script",
      })
      console.log(
        `  ok    ${email.padEnd(38)}  role=${user.role.padEnd(11)}  plan=${result.planSlug}  +${result.creditsGranted} credits  ${result.entitlementsRevoked.length ? `(revoked ${result.entitlementsRevoked.length})` : ""}`,
      )
      granted++
    } catch (err) {
      console.error(`  fail  ${email}`, err)
    }
  }

  console.log(`\nDone. Granted: ${granted}  Missing: ${missing}`)
  if (missing > 0) {
    console.log(
      "Re-run this script after the missing users sign in for the first time.",
    )
  }
}

main()
  .catch((err) => {
    console.error("grandfather-plan failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
