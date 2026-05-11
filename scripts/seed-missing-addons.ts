/**
 * One-shot: seed the 3 "real" addons that exist in addons.ts but are
 * missing from the DB Product table — addon-mighty-sync, addon-slack-alerts,
 * addon-reporting-pro. Required after the 2026-05-11 Option-1 launch
 * cutover. Idempotent.
 *
 * Run: source .env.local && ./node_modules/.bin/tsx scripts/seed-missing-addons.ts
 */
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { ADDONS } from "@/lib/plans/addons"

const live = new Stripe(process.env.STRIPE_SECRET_KEY!)
const db = new PrismaClient()

if (!process.env.STRIPE_SECRET_KEY!.startsWith("sk_live_")) {
  console.error("ABORT: STRIPE_SECRET_KEY is not a live key")
  process.exit(1)
}

const MISSING = [
  "addon-mighty-sync",
  "addon-slack-alerts",
  "addon-reporting-pro",
] as const

async function main() {
  for (const slug of MISSING) {
    const a = ADDONS.find((x) => x.slug === slug)
    if (!a) {
      console.log(`SKIP ${slug} — not in ADDONS registry`)
      continue
    }
    console.log(`\n${slug}  $${a.price}/mo  "${a.name}"`)

    const lookup = await live.products.search({
      query: `metadata['aoc_slug']:'${slug}'`,
      limit: 1,
    })
    let lp = lookup.data[0]
    if (!lp) {
      lp = await live.products.create({
        name: a.name,
        description: a.description,
        metadata: { aoc_slug: slug },
      })
      console.log(`  + live product created: ${lp.id}`)
    } else {
      console.log(`  . live product reused: ${lp.id}`)
    }

    const unit = Math.round(a.price * 100)
    const interval = a.pricing === "recurring" ? ("month" as const) : null
    const priceList = await live.prices.list({
      product: lp.id,
      active: true,
      limit: 100,
    })
    let pr = priceList.data.find(
      (p) =>
        p.unit_amount === unit &&
        (p.recurring?.interval ?? null) === interval,
    )
    if (!pr) {
      pr = await live.prices.create({
        product: lp.id,
        unit_amount: unit,
        currency: "usd",
        recurring: interval ? { interval } : undefined,
        metadata: {
          aoc_slug: slug,
          aoc_interval: interval ? "monthly" : "onetime",
        },
      })
      console.log(`  + live price created: ${pr.id}`)
    } else {
      console.log(`  . live price reused: ${pr.id}`)
    }

    await db.product.upsert({
      where: { slug },
      create: {
        slug,
        name: a.name,
        description: a.description,
        type: "addon",
        isActive: true,
        sortOrder: 100 + a.sortOrder,
        stripePriceMonthly: a.pricing === "recurring" ? pr.id : null,
        stripePriceOneTime: a.pricing === "one_time" ? pr.id : null,
        entitlements: a.entitlements as unknown as string[],
        commissionBps: 0,
      },
      update: {
        name: a.name,
        description: a.description,
        isActive: true,
        stripePriceMonthly: a.pricing === "recurring" ? pr.id : null,
        stripePriceOneTime: a.pricing === "one_time" ? pr.id : null,
        entitlements: a.entitlements as unknown as string[],
      },
    })
    console.log(`  + DB Product row upserted`)
  }

  await db.$disconnect()
  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
