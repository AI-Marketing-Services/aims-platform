/**
 * One-shot script to push updated lesson content to Mighty Networks.
 * Run with: node_modules/.bin/tsx --tsconfig tsconfig.json scripts/push-content.ts
 *
 * Loads MIGHTY_API_TOKEN + MIGHTY_NETWORK_ID from .env.local, then:
 *   1. Updates all 37 existing lesson descriptions with enriched Q&A content
 *   2. Creates 6 new lessons in the two empty sections
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local before any module that reads env vars
config({ path: resolve(process.cwd(), ".env.local") })

// Validate env before importing the pipeline (which reads env at module level via getConfig)
const token = process.env.MIGHTY_API_TOKEN?.replace(/\\n/g, "").trim()
const networkId = process.env.MIGHTY_NETWORK_ID?.replace(/\\n/g, "").trim()

if (!token || token === "mn_") {
  console.error("❌  MIGHTY_API_TOKEN is missing or placeholder in .env.local")
  process.exit(1)
}
if (!networkId) {
  console.error("❌  MIGHTY_NETWORK_ID is missing in .env.local")
  process.exit(1)
}

// Patch the env so the Mighty client gets clean values (strips literal \n from Vercel pull)
process.env.MIGHTY_API_TOKEN = token
process.env.MIGHTY_NETWORK_ID = networkId

console.log(`\n🔑  Token: ${token.slice(0, 12)}... Network: ${networkId}`)
console.log("━".repeat(60))

// Run AFTER env is set
async function main() {
  const { updateExistingLessons, createMissingLessons } = await import(
    "../src/lib/mighty/content-pipeline.js"
  )

  // ─── Step 1: Update existing 37 lessons ─────────────────────
  console.log("\n  Updating existing lessons...")
  const existing = await updateExistingLessons(23411754)
  console.log(`   Updated : ${existing.updated}`)
  console.log(`   Skipped : ${existing.skipped}`)
  if (existing.notFound.length > 0) {
    console.log(`   Not found (${existing.notFound.length}):`)
    existing.notFound.forEach((t) => console.log(`     - ${t}`))
  }

  // ─── Step 2: Create lessons in empty sections ────────────────
  console.log("\n  Creating missing lessons...")
  const missing = await createMissingLessons(23411754)
  console.log(`   Created : ${missing.created}`)
  if (missing.failed.length > 0) {
    console.log(`   Failed (${missing.failed.length}):`)
    missing.failed.forEach((t) => console.log(`     - ${t}`))
  }

  // ─── Summary ─────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60))
  console.log(`\nDone.`)
  console.log(`   ${existing.updated} lessons updated in Mighty Networks`)
  console.log(`   ${missing.created} new lessons created in empty sections`)
  console.log(
    `\n   View at: https://aioperatorcollective.mn.co/spaces/23411754\n`
  )
}

main().catch((err) => {
  console.error("Push failed:", err)
  process.exit(1)
})
