import { searchKnowledge, getKnowledgeStats } from "@/lib/knowledge"

async function main() {
  const stats = await getKnowledgeStats()
  console.log("--- stats ---")
  console.log(JSON.stringify(stats, null, 2))

  const queries = ["getting started", "onboarding", "community", "ai tools", "lesson"]
  for (const q of queries) {
    console.log(`\n--- query: "${q}" ---`)
    const r = await searchKnowledge(q, 3)
    if (r.entries.length === 0) {
      console.log("  (no hits)")
      continue
    }
    for (const e of r.entries) {
      console.log(`  [${e.source}] ${e.title.slice(0, 60)}`)
      if (e.url) console.log(`    url: ${e.url}`)
      console.log(`    snippet: ${e.snippet.slice(0, 100).replace(/\n/g, " ")}`)
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
