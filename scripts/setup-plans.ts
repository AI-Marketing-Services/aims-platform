/**
 * Seed Stripe + the Product table from `lib/plans/registry.ts`.
 *
 * For each plan (free / pro / operator):
 *   1. Upsert the Product row (idempotent on slug).
 *   2. If priceMonthly > 0, ensure a Stripe Product + monthly Price exist;
 *      write the Stripe price ID back onto the Product row.
 *   3. Free plan stays without a Stripe Product (no checkout needed).
 *
 * For each credit pack (one-time addon):
 *   1. Upsert the Product row with type="addon" + creditsOneTime set.
 *   2. Ensure Stripe Product + one-time Price exist.
 *
 * Idempotent — re-running with the same registry + Stripe state is a no-op.
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/setup-plans.ts        # test mode
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/setup-plans.ts --live # live mode (requires sk_live key)
 */

import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { PLANS, CREDIT_PACKS } from "../src/lib/plans/registry"
import { ADDONS } from "../src/lib/plans/addons"

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL not set — source .env.local first")
    process.exit(1)
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[FAIL] STRIPE_SECRET_KEY not set")
    process.exit(1)
  }

  const wantLive = process.argv.includes("--live")
  const key = process.env.STRIPE_SECRET_KEY
  const isLiveKey = key.startsWith("sk_live_")

  if (wantLive && !isLiveKey) {
    console.error("[FAIL] --live passed but STRIPE_SECRET_KEY is a test key")
    process.exit(1)
  }
  if (!wantLive && isLiveKey) {
    console.error(
      "[FAIL] STRIPE_SECRET_KEY is a LIVE key — pass --live explicitly to confirm",
    )
    process.exit(1)
  }

  const mode = wantLive ? "LIVE" : "TEST"
  console.log(`[OK] Running setup-plans in ${mode} mode\n`)

  const stripe = new Stripe(key)
  const db = new PrismaClient()

  try {
    // ─── PLANS ────────────────────────────────────────────────────────
    console.log("─── Plans ───────────────────────────────────────────")
    for (const plan of PLANS) {
      const isFree = plan.priceMonthly === 0

      let stripeProductId: string | null = null
      let stripePriceMonthly: string | null = null

      if (!isFree) {
        // Find or create Stripe product (looked up by metadata.slug so we
        // don't accidentally create a duplicate if the script re-runs).
        const existingProducts = await stripe.products.search({
          query: `metadata['slug']:'${plan.slug}'`,
          limit: 1,
        })
        const stripeProduct =
          existingProducts.data[0] ??
          (await stripe.products.create({
            name: `AIMS ${plan.name} Plan`,
            description: plan.tagline,
            metadata: { slug: plan.slug, kind: "plan" },
          }))
        stripeProductId = stripeProduct.id

        // Stripe Prices are immutable. Look for an existing matching
        // monthly price, otherwise create one.
        const prices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          limit: 100,
        })
        const targetCents = Math.round(plan.priceMonthly * 100)
        const matched = prices.data.find(
          (p) =>
            p.recurring?.interval === "month" &&
            p.unit_amount === targetCents &&
            p.currency === "usd",
        )
        const monthlyPrice =
          matched ??
          (await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: targetCents,
            currency: "usd",
            recurring: { interval: "month" },
            metadata: { slug: plan.slug, kind: "plan-monthly" },
          }))
        stripePriceMonthly = monthlyPrice.id

        console.log(
          `  ${plan.slug.padEnd(10)} → stripe ${stripeProduct.id}  price ${monthlyPrice.id}  $${plan.priceMonthly}/mo`,
        )
      } else {
        console.log(`  ${plan.slug.padEnd(10)} → (free, no Stripe product)`)
      }

      // Upsert local Product row.
      await db.product.upsert({
        where: { slug: plan.slug },
        create: {
          slug: plan.slug,
          name: plan.name,
          description: plan.description,
          type: "tier",
          isActive: true,
          sortOrder: plan.sortOrder,
          stripePriceMonthly,
          entitlements: plan.entitlements,
          creditsPerMonth: plan.creditsPerMonth,
          marketingVideoUrl: plan.marketingVideoUrl,
          metadata: {
            tagline: plan.tagline,
            highlights: plan.highlights,
            badge: plan.badge,
          },
        },
        update: {
          name: plan.name,
          description: plan.description,
          isActive: true,
          sortOrder: plan.sortOrder,
          stripePriceMonthly: stripePriceMonthly ?? undefined,
          entitlements: plan.entitlements,
          creditsPerMonth: plan.creditsPerMonth,
          marketingVideoUrl: plan.marketingVideoUrl,
          metadata: {
            tagline: plan.tagline,
            highlights: plan.highlights,
            badge: plan.badge,
          },
        },
      })
    }

    // ─── CREDIT PACKS ─────────────────────────────────────────────────
    console.log("\n─── Credit packs ────────────────────────────────────")
    for (const pack of CREDIT_PACKS) {
      const existingProducts = await stripe.products.search({
        query: `metadata['slug']:'${pack.slug}'`,
        limit: 1,
      })
      const stripeProduct =
        existingProducts.data[0] ??
        (await stripe.products.create({
          name: `AIMS ${pack.name}`,
          description: `One-time top-up: ${pack.credits.toLocaleString()} enrichment credits.`,
          metadata: { slug: pack.slug, kind: "credit-pack" },
        }))

      const prices = await stripe.prices.list({
        product: stripeProduct.id,
        active: true,
        limit: 100,
      })
      const targetCents = Math.round(pack.price * 100)
      const matched = prices.data.find(
        (p) =>
          p.recurring === null &&
          p.unit_amount === targetCents &&
          p.currency === "usd",
      )
      const oneTimePrice =
        matched ??
        (await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: targetCents,
          currency: "usd",
          // No `recurring` block → one-time price.
          metadata: { slug: pack.slug, kind: "credit-pack-onetime" },
        }))

      console.log(
        `  ${pack.slug.padEnd(14)} → stripe ${stripeProduct.id}  price ${oneTimePrice.id}  $${pack.price} → +${pack.credits.toLocaleString()} credits`,
      )

      await db.product.upsert({
        where: { slug: pack.slug },
        create: {
          slug: pack.slug,
          name: pack.name,
          description: `${pack.credits.toLocaleString()} enrichment credits — one-time top-up.`,
          type: "addon",
          isActive: true,
          sortOrder: pack.sortOrder,
          stripePriceOneTime: oneTimePrice.id,
          entitlements: [],
          creditsOneTime: pack.credits,
          metadata: { badge: pack.badge ?? null },
        },
        update: {
          name: pack.name,
          description: `${pack.credits.toLocaleString()} enrichment credits — one-time top-up.`,
          isActive: true,
          sortOrder: pack.sortOrder,
          stripePriceOneTime: oneTimePrice.id,
          creditsOneTime: pack.credits,
          metadata: { badge: pack.badge ?? null },
        },
      })
    }

    // ─── A-LA-CARTE ADD-ONS ───────────────────────────────────────────
    console.log("\n─── Add-ons ─────────────────────────────────────────")
    for (const addon of ADDONS) {
      const existingProducts = await stripe.products.search({
        query: `metadata['slug']:'${addon.slug}'`,
        limit: 1,
      })
      const stripeProduct =
        existingProducts.data[0] ??
        (await stripe.products.create({
          name: `AIMS ${addon.name}`,
          description: addon.tagline,
          metadata: {
            slug: addon.slug,
            kind: "addon",
            category: addon.category,
            launchStatus: addon.launchStatus,
          },
        }))

      const prices = await stripe.prices.list({
        product: stripeProduct.id,
        active: true,
        limit: 100,
      })
      const targetCents = Math.round(addon.price * 100)
      const isRecurring = addon.pricing === "recurring"
      const matched = prices.data.find((p) => {
        if (p.unit_amount !== targetCents || p.currency !== "usd") return false
        if (isRecurring) return p.recurring?.interval === "month"
        return p.recurring === null
      })
      const stripePrice =
        matched ??
        (await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: targetCents,
          currency: "usd",
          ...(isRecurring
            ? { recurring: { interval: "month" } }
            : {}),
          metadata: {
            slug: addon.slug,
            kind: isRecurring ? "addon-monthly" : "addon-onetime",
          },
        }))

      console.log(
        `  ${addon.slug.padEnd(28)} → ${stripeProduct.id}  $${addon.price}${
          isRecurring ? "/mo" : " one-time"
        }  [${addon.launchStatus}]`,
      )

      await db.product.upsert({
        where: { slug: addon.slug },
        create: {
          slug: addon.slug,
          name: addon.name,
          description: addon.description,
          type: "addon",
          isActive: true,
          sortOrder: 100 + addon.sortOrder, // sort after credit packs
          ...(isRecurring
            ? { stripePriceMonthly: stripePrice.id }
            : { stripePriceOneTime: stripePrice.id }),
          entitlements: addon.entitlements,
          metadata: {
            tagline: addon.tagline,
            highlights: addon.highlights,
            iconName: addon.iconName,
            category: addon.category,
            launchStatus: addon.launchStatus,
            badge: addon.badge ?? null,
            href: addon.href,
          },
        },
        update: {
          name: addon.name,
          description: addon.description,
          isActive: true,
          sortOrder: 100 + addon.sortOrder,
          ...(isRecurring
            ? { stripePriceMonthly: stripePrice.id }
            : { stripePriceOneTime: stripePrice.id }),
          entitlements: addon.entitlements,
          metadata: {
            tagline: addon.tagline,
            highlights: addon.highlights,
            iconName: addon.iconName,
            category: addon.category,
            launchStatus: addon.launchStatus,
            badge: addon.badge ?? null,
            href: addon.href,
          },
        },
      })
    }

    console.log("\n[OK] Plans + credit packs + add-ons synced.")
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error("setup-plans failed:", err)
  process.exit(1)
})
