import { PrismaClient } from "@prisma/client"
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs"
import { join } from "path"

// Smoke test for the whitelabel DB layer. Can run in two modes:
//   tsx scripts/test-whitelabel.ts           — seed a test OperatorSite, verify resolver
//   tsx scripts/test-whitelabel.ts cleanup   — remove the test row + revert branding
//
// Safety: when the seed-target already has a MemberProfile, we snapshot
// the fields we intend to mutate into .whitelabel-smoke-test-snapshot.json
// so cleanup can restore them. Without this, rerunning seed without
// cleanup would silently clobber real user branding.

const SNAPSHOT_PATH = join(process.cwd(), ".whitelabel-smoke-test-snapshot.json")

type ProfileSnapshot = {
  userId: string
  email: string
  accentColor: string | null
  fontHeading: string | null
} | null

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
        // We created the profile fresh — safe to delete outright.
        await db.memberProfile.delete({ where: { userId: user.id } })
        if (existsSync(SNAPSHOT_PATH)) unlinkSync(SNAPSHOT_PATH)
        console.log(`[OK] Deleted test MemberProfile + OperatorSite for ${user.email}`)
        return
      }

      // We mutated an existing profile — restore from snapshot.
      if (existsSync(SNAPSHOT_PATH)) {
        const snap: ProfileSnapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"))
        if (snap && snap.userId === user.id) {
          await db.memberProfile.update({
            where: { userId: user.id },
            data: { accentColor: snap.accentColor, fontHeading: snap.fontHeading },
          })
          unlinkSync(SNAPSHOT_PATH)
          console.log(`[OK] Restored MemberProfile fields for ${user.email} from snapshot`)
        } else {
          console.log("[WARN] Snapshot belongs to a different user — leaving MemberProfile as-is")
        }
      } else {
        console.log(`[OK] Deleted test OperatorSite. MemberProfile preserved — no snapshot found`)
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
      // Snapshot the two fields we're about to mutate — cleanup reads this back.
      const snap: ProfileSnapshot = {
        userId: user.id,
        email: user.email,
        accentColor: user.memberProfile.accentColor,
        fontHeading: user.memberProfile.fontHeading,
      }
      writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2))
      await db.memberProfile.update({
        where: { userId: user.id },
        data: { accentColor: "#f59e0b", fontHeading: "DM Sans" },
      })
      console.log(`[OK] MemberProfile updated. Original values snapshotted to ${SNAPSHOT_PATH}`)
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
