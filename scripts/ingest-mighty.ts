/**
 * Local/CLI entry-point for Mighty → KnowledgeEntry ingestion.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/ingest-mighty.ts
 *
 * Equivalent to hitting POST /api/admin/knowledge/run, but doesn't
 * need a signed-in admin session — uses the lib directly against
 * the connected DB.
 */

import { ingestMighty } from "@/lib/knowledge/ingest"

async function main() {
  if (!process.env.MIGHTY_API_TOKEN) {
    console.error("[FAIL] MIGHTY_API_TOKEN not set — source .env.local first")
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL not set — source .env.local first")
    process.exit(1)
  }

  console.log("[OK] Starting Mighty ingestion (this can take a minute)…")
  const result = await ingestMighty("cli")

  console.log(`[${result.status.toUpperCase()}] run ${result.runId}`)
  console.log(`  Seen: ${result.itemsSeen}`)
  console.log(`  Upserted: ${result.itemsUpserted}`)
  console.log(`  Failed: ${result.itemsFailed}`)
  if (result.errorMessage) console.log(`  Error: ${result.errorMessage}`)
  for (const [source, s] of Object.entries(result.sources)) {
    console.log(`    ${source}: seen=${s.seen} upserted=${s.upserted} failed=${s.failed}`)
  }

  process.exit(result.status === "error" ? 1 : 0)
}

main().catch((err) => {
  console.error("[FAIL]", err)
  process.exit(1)
})
