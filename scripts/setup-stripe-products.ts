/**
 * Sync the local Product catalog into Stripe.
 *
 * For each row in the Product table:
 *   - Ensure a Stripe Product exists matching `slug` (lookup by metadata.slug)
 *   - For each pricing dimension this product needs (monthly / annual /
 *     one-time), ensure a Stripe Price exists, creating if missing
 *   - Write the Stripe IDs back into the local Product row
 *
 * Idempotent: re-running with the same DB state and Stripe state is a
 * no-op. Adding a NEW pricing dimension creates a new Price; removing
 * one leaves the old Price archived in Stripe (this script never
 * deletes — Stripe Prices are immutable for accounting reasons).
 *
 * Run:  source .env.local && npx tsx scripts/setup-stripe-products.ts [--live]
 *
 * Reads default unit amounts from a hardcoded map below — adjust
 * before running. After running, /admin/products will show the price
 * IDs populated.
 */

import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

// ─── DEFAULT PRICING (cents, USD) — edit before running for prod ──────────────
// All amounts are PLACEHOLDERS — Adam should update before first
// live-mode run. Test mode is fine to seed with these for end-to-end
// flow validation.
const PRICING: Record<
  string,
  { monthly?: number; annual?: number; oneTime?: number }
> = {
  member: { monthly: 9700, annual: 99700 }, // $97/mo, $997/yr
  operator: { monthly: 19700, annual: 199700 }, // $197/mo, $1,997/yr
  reseller: { monthly: 49700, annual: 497700 }, // $497/mo, $4,977/yr
  "voice-agent": { monthly: 9700 }, // $97/mo addon
  "chatbot-premium": { monthly: 4900 }, // $49/mo a la carte
}

type Mode = "test" | "live"

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL not set — source .env.local first")
    process.exit(1)
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[FAIL] STRIPE_SECRET_KEY not set — add it to .env.local")
    process.exit(1)
  }

  const live = process.argv.includes("--live")
  const mode: Mode = live ? "live" : "test"
  const key = process.env.STRIPE_SECRET_KEY
  const isLiveKey = key.startsWith("sk_live_")

  if (live && !isLiveKey) {
    console.error(`[FAIL] --live passed but STRIPE_SECRET_KEY is a test key. Aborting.`)
    process.exit(1)
  }
  if (!live && isLiveKey) {
    console.error(
      "[FAIL] STRIPE_SECRET_KEY is a LIVE key — refusing to run without --live flag.\n" +
        "If you're sure, re-run with: npx tsx scripts/setup-stripe-products.ts --live",
    )
    process.exit(1)
  }

  console.log(`[OK] Running in ${mode.toUpperCase()} mode`)

  const stripe = new Stripe(key)
  const db = new PrismaClient()

  try {
    const products = await db.product.findMany({ orderBy: { sortOrder: "asc" } })

    for (const p of products) {
      const pricing = PRICING[p.slug]
      if (!pricing) {
        console.log(`[SKIP] ${p.slug} — no pricing defined in PRICING map`)
        continue
      }

      // Step 1: Find or create the Stripe Product. We tag it with
      // metadata.aoc_slug so we can look it up reliably across runs.
      const found = await stripe.products.search({
        query: `metadata['aoc_slug']:'${p.slug}'`,
        limit: 1,
      })

      let stripeProduct: Stripe.Product
      if (found.data[0]) {
        stripeProduct = found.data[0]
        // Keep name/description in sync if they drift.
        if (
          stripeProduct.name !== p.name ||
          stripeProduct.description !== (p.description ?? null)
        ) {
          stripeProduct = await stripe.products.update(stripeProduct.id, {
            name: p.name,
            description: p.description ?? undefined,
          })
        }
      } else {
        stripeProduct = await stripe.products.create({
          name: p.name,
          description: p.description ?? undefined,
          metadata: { aoc_slug: p.slug, aoc_type: p.type },
        })
        console.log(`[CREATE] Stripe product → ${stripeProduct.id} (${p.slug})`)
      }

      // Step 2: For each pricing dimension we want, ensure a Price exists.
      // Stripe prices are immutable — if the amount changes, we create a
      // new price rather than mutating the old one (it gets archived).
      const updates: {
        stripePriceMonthly?: string | null
        stripePriceAnnual?: string | null
        stripePriceOneTime?: string | null
      } = {}

      if (pricing.monthly !== undefined) {
        updates.stripePriceMonthly = await ensurePrice({
          stripe,
          productId: stripeProduct.id,
          unitAmount: pricing.monthly,
          interval: "month",
          existingId: p.stripePriceMonthly,
          slug: p.slug,
          dim: "monthly",
        })
      }
      if (pricing.annual !== undefined) {
        updates.stripePriceAnnual = await ensurePrice({
          stripe,
          productId: stripeProduct.id,
          unitAmount: pricing.annual,
          interval: "year",
          existingId: p.stripePriceAnnual,
          slug: p.slug,
          dim: "annual",
        })
      }
      if (pricing.oneTime !== undefined) {
        updates.stripePriceOneTime = await ensurePrice({
          stripe,
          productId: stripeProduct.id,
          unitAmount: pricing.oneTime,
          interval: "one_time",
          existingId: p.stripePriceOneTime,
          slug: p.slug,
          dim: "one-time",
        })
      }

      await db.product.update({ where: { id: p.id }, data: updates })
      console.log(`[OK] ${p.slug} synced. Prices:`, updates)
    }

    console.log("\n[DONE] All products synced.")
    console.log(`Stripe dashboard: https://dashboard.stripe.com/${mode === "test" ? "test/" : ""}products`)
  } finally {
    await db.$disconnect()
  }
}

async function ensurePrice(args: {
  stripe: Stripe
  productId: string
  unitAmount: number
  interval: "month" | "year" | "one_time"
  existingId: string | null
  slug: string
  dim: string
}): Promise<string> {
  // If we already have a price ID locally, verify it still exists in
  // Stripe AND has the right unit amount. If it does, reuse. If not,
  // create a new one (Stripe prices are immutable — can't edit amount).
  if (args.existingId) {
    try {
      const existing = await args.stripe.prices.retrieve(args.existingId)
      const isRecurring = args.interval !== "one_time"
      const matchesAmount = existing.unit_amount === args.unitAmount
      const matchesInterval =
        isRecurring
          ? existing.recurring?.interval === args.interval
          : existing.type === "one_time"
      if (existing.active && matchesAmount && matchesInterval) {
        return args.existingId
      }
      console.log(
        `[REPLACE] ${args.slug} ${args.dim} price drifted (was ${existing.unit_amount}, want ${args.unitAmount}). Creating new.`,
      )
    } catch {
      console.log(`[REPLACE] ${args.slug} ${args.dim} price ${args.existingId} not found. Creating.`)
    }
  }

  const created = await args.stripe.prices.create({
    product: args.productId,
    currency: "usd",
    unit_amount: args.unitAmount,
    ...(args.interval !== "one_time"
      ? { recurring: { interval: args.interval } }
      : {}),
    metadata: { aoc_slug: args.slug, aoc_dim: args.dim },
  })
  console.log(`[CREATE] Stripe price → ${created.id} (${args.slug} ${args.dim} $${args.unitAmount / 100})`)
  return created.id
}

main().catch((err) => {
  console.error("[FAIL]", err)
  process.exit(1)
})
