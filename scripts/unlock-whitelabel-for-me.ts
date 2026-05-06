/**
 * One-shot: unlock whitelabel for adamwolfe102@gmail.com.
 *
 * Sets MemberProfile.onboardingCompletedAt to NOW() so the whitelabel
 * gate (`checkWhitelabelAccess`) passes even when the SUPER_ADMIN is
 * previewing as a CLIENT via the "View as" toggle.
 *
 * SUPER_ADMIN already passes the gate as themselves; this script just
 * unblocks the client-preview path so we can dogfood the actual UX.
 *
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/unlock-whitelabel-for-me.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const TARGET_EMAIL = "adamwolfe102@gmail.com"

async function main() {
  const user = await db.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, role: true, clerkId: true },
  })
  if (!user) {
    console.error(`No User row found for ${TARGET_EMAIL}.`)
    process.exit(1)
  }

  console.log(`Found user: ${user.email}  role=${user.role}  id=${user.id}`)

  const before = await db.memberProfile.findUnique({
    where: { userId: user.id },
    select: { onboardingCompletedAt: true, businessName: true, logoUrl: true },
  })
  console.log("Before:", before)

  const profile = await db.memberProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      onboardingCompletedAt: new Date(),
    },
    update: {
      onboardingCompletedAt: new Date(),
    },
  })

  console.log("After:")
  console.log(`  onboardingCompletedAt: ${profile.onboardingCompletedAt?.toISOString()}`)
  console.log(`  businessName: ${profile.businessName ?? "(empty — set via /reseller/settings/branding)"}`)
  console.log(`  logoUrl: ${profile.logoUrl ?? "(empty — upload via /reseller/settings/branding)"}`)
  console.log("\nWhitelabel is now unlocked. Visit /reseller/settings/branding to start.")
}

main()
  .catch((err) => {
    console.error("Failed:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
