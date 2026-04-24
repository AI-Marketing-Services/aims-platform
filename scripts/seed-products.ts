/**
 * Seed the AIMS commerce catalog with default tiers + a la carte tools.
 *
 * Idempotent — re-runs upsert by slug. Safe to invoke after manual
 * edits in /admin/products; will only update fields the seed defines
 * (existing Stripe price IDs and tweaks via UI are preserved IF you
 * comment those fields out below before re-running).
 *
 * Run:  source .env.local && npx tsx scripts/seed-products.ts
 *
 * After running, set the Stripe price IDs in /admin/products. They're
 * intentionally null in the seed so this script doesn't accidentally
 * reset live prices when re-run in prod.
 */

import { PrismaClient } from "@prisma/client"

type Seed = {
  slug: string
  name: string
  description: string
  type: "tier" | "tool" | "addon"
  sortOrder: number
  entitlements: string[]
  commissionBps: number
  grantsRole?: "CLIENT" | "RESELLER"
}

const SEEDS: Seed[] = [
  // ─── Tiers ────────────────────────────────────────────────────────
  {
    slug: "member",
    name: "Member",
    description: "Access to the AI Operator Collective community on Mighty Networks, the playbook vault, and weekly live calls.",
    type: "tier",
    sortOrder: 10,
    entitlements: ["member-only-content", "playbook-vault"],
    commissionBps: 2000, // 20%
    grantsRole: "CLIENT",
  },
  {
    slug: "operator",
    name: "Operator",
    description: "Everything in Member, plus the AI chatbot (premium model), audit tool access, and a la carte voice agent purchases.",
    type: "tier",
    sortOrder: 20,
    entitlements: ["member-only-content", "playbook-vault", "chatbot-premium", "audit-tool"],
    commissionBps: 2500, // 25%
    grantsRole: "CLIENT",
  },
  {
    slug: "reseller",
    name: "Reseller",
    description: "Everything in Operator, plus whitelabel tenant page, custom-domain support, commission tracking, and the partner dashboard.",
    type: "tier",
    sortOrder: 30,
    entitlements: [
      "member-only-content",
      "playbook-vault",
      "chatbot-premium",
      "audit-tool",
      "whitelabel-tools",
      "commission-tracking",
    ],
    commissionBps: 3000, // 30% — resellers get the highest rate on second-tier referrals
    grantsRole: "RESELLER",
  },

  // ─── A la carte tools ─────────────────────────────────────────────
  {
    slug: "voice-agent",
    name: "Voice Agent",
    description: "Outbound + inbound AI voice agent for client follow-up calls. Add-on to any tier.",
    type: "tool",
    sortOrder: 100,
    entitlements: ["voice-agent"],
    commissionBps: 2000,
  },
  {
    slug: "chatbot-premium",
    name: "Chatbot Premium",
    description: "Upgrades the portal chatbot to the premium model (sharper answers, longer context). Included in Operator and Reseller tiers.",
    type: "tool",
    sortOrder: 110,
    entitlements: ["chatbot-premium"],
    commissionBps: 2000,
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL not set — source .env.local first")
    process.exit(1)
  }
  const db = new PrismaClient()
  try {
    let created = 0
    let updated = 0
    for (const s of SEEDS) {
      const existing = await db.product.findUnique({ where: { slug: s.slug } })
      const data = {
        name: s.name,
        description: s.description,
        type: s.type,
        sortOrder: s.sortOrder,
        entitlements: s.entitlements,
        commissionBps: s.commissionBps,
        grantsRole: s.grantsRole ?? null,
      }
      if (existing) {
        await db.product.update({ where: { slug: s.slug }, data })
        updated += 1
        console.log(`[UPDATE] ${s.slug}`)
      } else {
        await db.product.create({
          data: {
            slug: s.slug,
            isActive: true,
            ...data,
          },
        })
        created += 1
        console.log(`[CREATE] ${s.slug}`)
      }
    }
    console.log(`\n[DONE] ${created} created, ${updated} updated`)
    console.log("Next: open /admin/products to attach Stripe price IDs.")
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error("[FAIL]", err)
  process.exit(1)
})
