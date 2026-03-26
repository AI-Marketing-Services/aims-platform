/**
 * Stripe Product & Price Setup Script
 *
 * Creates Stripe products and prices for all ServiceArm tiers in the database.
 * Idempotent: skips tiers that already have a stripePriceId set.
 *
 * Usage: npm run stripe:setup
 * Requires: STRIPE_SECRET_KEY, DATABASE_URL
 */

import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

interface SetupStats {
  readonly productsCreated: number
  readonly productsSkipped: number
  readonly pricesCreated: number
  readonly pricesSkipped: number
}

const EMPTY_STATS: SetupStats = {
  productsCreated: 0,
  productsSkipped: 0,
  pricesCreated: 0,
  pricesSkipped: 0,
}

function mergeStats(a: SetupStats, b: Partial<SetupStats>): SetupStats {
  return {
    productsCreated: a.productsCreated + (b.productsCreated ?? 0),
    productsSkipped: a.productsSkipped + (b.productsSkipped ?? 0),
    pricesCreated: a.pricesCreated + (b.pricesCreated ?? 0),
    pricesSkipped: a.pricesSkipped + (b.pricesSkipped ?? 0),
  }
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
}

function validateEnv(): { stripeKey: string; databaseUrl: string } {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const databaseUrl = process.env.DATABASE_URL

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env file.")
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.")
  }

  return { stripeKey, databaseUrl }
}

async function findExistingStripeProduct(
  stripe: Stripe,
  serviceSlug: string
): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata["serviceArmSlug"]:"${serviceSlug}"`,
  })

  const activeProduct = products.data.find((p) => p.active)
  return activeProduct ?? null
}

async function createStripeProduct(
  stripe: Stripe,
  service: { name: string; slug: string; shortDesc: string }
): Promise<Stripe.Product> {
  return stripe.products.create({
    name: service.name,
    description: service.shortDesc,
    metadata: {
      serviceArmSlug: service.slug,
      source: "aims-setup-script",
    },
  })
}

async function createStripePrice(
  stripe: Stripe,
  productId: string,
  tier: { name: string; slug: string; price: number; interval: string }
): Promise<Stripe.Price> {
  const intervalMap: Record<string, Stripe.PriceCreateParams.Recurring.Interval> = {
    month: "month",
    quarter: "month", // Stripe doesn't have "quarter" -- use 3-month interval
    year: "year",
    week: "week",
    day: "day",
  }

  const stripeInterval = intervalMap[tier.interval] ?? "month"
  const intervalCount = tier.interval === "quarter" ? 3 : 1

  return stripe.prices.create({
    product: productId,
    unit_amount: tier.price,
    currency: "usd",
    recurring: {
      interval: stripeInterval,
      interval_count: intervalCount,
    },
    metadata: {
      tierSlug: tier.slug,
      tierName: tier.name,
      source: "aims-setup-script",
    },
  })
}

async function processServiceArm(
  stripe: Stripe,
  prisma: PrismaClient,
  service: {
    id: string
    name: string
    slug: string
    shortDesc: string
    tiers: Array<{
      id: string
      name: string
      slug: string
      price: number
      interval: string
      stripePriceId: string | null
    }>
  }
): Promise<SetupStats> {
  let stats = { ...EMPTY_STATS }
  const tierOutputs: string[] = []

  // Skip services with no tiers
  if (service.tiers.length === 0) {
    process.stdout.write(`  ${service.name}: No tiers defined, skipping\n`)
    return stats
  }

  // Check if all tiers already have stripePriceIds
  const tiersNeedingPrices = service.tiers.filter((t) => !t.stripePriceId)
  if (tiersNeedingPrices.length === 0) {
    const tierSummary = service.tiers
      .map((t) => `${t.name}: ${formatPrice(t.price)}/mo (${t.stripePriceId})`)
      .join(" | ")
    process.stdout.write(`  ${service.name}: Already configured | ${tierSummary}\n`)
    stats = mergeStats(stats, {
      productsSkipped: 1,
      pricesSkipped: service.tiers.length,
    })
    return stats
  }

  // Find or create Stripe product
  let product = await findExistingStripeProduct(stripe, service.slug)

  if (product) {
    tierOutputs.push(`Product exists (${product.id})`)
    stats = mergeStats(stats, { productsSkipped: 1 })
  } else {
    product = await createStripeProduct(stripe, service)
    tierOutputs.push(`Product created (${product.id})`)
    stats = mergeStats(stats, { productsCreated: 1 })
  }

  // Create prices for each tier that needs one
  for (const tier of service.tiers) {
    if (tier.stripePriceId) {
      tierOutputs.push(`${tier.name}: ${formatPrice(tier.price)}/mo (${tier.stripePriceId}) [existing]`)
      stats = mergeStats(stats, { pricesSkipped: 1 })
      continue
    }

    const price = await createStripePrice(stripe, product.id, tier)

    // Update the ServiceTier with the new stripePriceId
    await prisma.serviceTier.update({
      where: { id: tier.id },
      data: { stripePriceId: price.id },
    })

    tierOutputs.push(`${tier.name}: ${formatPrice(tier.price)}/mo (${price.id})`)
    stats = mergeStats(stats, { pricesCreated: 1 })
  }

  process.stdout.write(`  ${service.name}: ${tierOutputs.join(" | ")}\n`)
  return stats
}

async function main(): Promise<void> {
  const { stripeKey } = validateEnv()

  const stripe = new Stripe(stripeKey, { typescript: true })
  const prisma = new PrismaClient()

  try {
    // Verify Stripe connection
    const account = await stripe.accounts.retrieve()
    process.stdout.write(
      `Connected to Stripe account: ${account.settings?.dashboard?.display_name ?? account.id}\n\n`
    )

    // Fetch all service arms with their tiers
    const serviceArms = await prisma.serviceArm.findMany({
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    if (serviceArms.length === 0) {
      process.stdout.write("No service arms found in the database. Run `npm run db:seed` first.\n")
      return
    }

    process.stdout.write(`Setting up Stripe products for ${serviceArms.length} service arms...\n\n`)

    let totalStats = { ...EMPTY_STATS }

    for (const service of serviceArms) {
      const serviceStats = await processServiceArm(stripe, prisma, service)
      totalStats = mergeStats(totalStats, serviceStats)
    }

    process.stdout.write(
      `\nSetup complete! ${totalStats.productsCreated} products created, ` +
        `${totalStats.pricesCreated} prices created. ` +
        `(${totalStats.productsSkipped} products skipped, ` +
        `${totalStats.pricesSkipped} prices skipped)\n`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  process.stderr.write(`Setup failed: ${err instanceof Error ? err.message : String(err)}\n`)
  if (err instanceof Error && err.stack) {
    process.stderr.write(`${err.stack}\n`)
  }
  process.exit(1)
})
