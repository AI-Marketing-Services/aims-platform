import { PrismaClient } from "@prisma/client"

// Smoke test for the whitelabel DB layer. Can run in two modes:
//   tsx scripts/test-whitelabel.ts           — seed a test OperatorSite, verify resolver
//   tsx scripts/test-whitelabel.ts cleanup   — remove the test row + revert branding
async function main() {
  const mode = process.argv[2] === "cleanup" ? "cleanup" : "seed"
  const db = new PrismaClient()
  try {
    const user = await db.user.findFirst({
      where: { role: { in: ["RESELLER", "ADMIN", "SUPER_ADMIN"] } },
      include: { memberProfile: true, operatorSite: true },
    })

    if (!user) {
      console.log("[FAIL] No eligible user (RESELLER/ADMIN) exists")
      return
    }

    if (mode === "cleanup") {
      await db.operatorSite.deleteMany({ where: { userId: user.id, subdomain: "smoke-test" } })
      if (user.memberProfile?.businessName === "Smoke Test Agency") {
        await db.memberProfile.delete({ where: { userId: user.id } })
        console.log(`[OK] Deleted test MemberProfile + OperatorSite for ${user.email}`)
      } else {
        console.log(`[OK] Deleted test OperatorSite (MemberProfile preserved — wasn't a test seed)`)
      }
      return
    }

    console.log(`[OK] Using user: ${user.email} (role: ${user.role})`)

    const site = await db.operatorSite.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        subdomain: "smoke-test",
        isPublished: true,
        themeId: "aoc-default",
        homepageContent: {},
      },
      update: { subdomain: "smoke-test", isPublished: true },
    })
    console.log(`[OK] OperatorSite: ${site.id} — slug=${site.subdomain}, published=${site.isPublished}`)

    if (!user.memberProfile) {
      await db.memberProfile.create({
        data: {
          userId: user.id,
          businessName: "Smoke Test Agency",
          tagline: "We smoke-test everything",
          brandColor: "#7c3aed",
          accentColor: "#f59e0b",
          fontHeading: "DM Sans",
        },
      })
      console.log(`[OK] MemberProfile created with new fields`)
    } else {
      await db.memberProfile.update({
        where: { userId: user.id },
        data: { accentColor: "#f59e0b", fontHeading: "DM Sans" },
      })
      console.log(`[OK] MemberProfile updated with new fields (existing businessName preserved)`)
    }

    const lookup = await db.operatorSite.findFirst({
      where: { subdomain: "smoke-test", isPublished: true },
      include: { user: { include: { memberProfile: true } } },
    })
    if (!lookup) {
      console.log("[FAIL] Resolver query returned null")
      return
    }
    console.log(`[OK] Subdomain resolver: ${lookup.user.memberProfile?.businessName ?? lookup.subdomain}`)
    console.log(`     brandColor=${lookup.user.memberProfile?.brandColor}, fontHeading=${lookup.user.memberProfile?.fontHeading}`)

    console.log("\n[PASS] DB layer works. Local test URLs:")
    console.log("       http://localhost:3000/sites/smoke-test  (direct route, bypasses middleware)")
    console.log("       http://smoke-test.localhost:3000         (full middleware path, add host to /etc/hosts)")
  } catch (err) {
    console.error("[FAIL]", err)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
