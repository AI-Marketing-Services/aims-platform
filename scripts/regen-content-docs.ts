/**
 * Regenerate docs/mighty/CONTENT-FULL.md and docs/mighty/CONTENT-INVENTORY.md
 * from the enriched lesson definitions in content-pipeline.ts.
 *
 * Run: node_modules/.bin/tsx --tsconfig tsconfig.json scripts/regen-content-docs.ts
 */

import { writeFileSync } from "fs"
import { resolve } from "path"

// ─── Simple HTML → Markdown converter ───────────────────────
function htmlToMd(html: string): string {
  return html
    .replace(/<h2>(.*?)<\/h2>/g, "\n## $1\n")
    .replace(/<h3>(.*?)<\/h3>/g, "\n### $1\n")
    .replace(/<h4>(.*?)<\/h4>/g, "\n#### $1\n")
    .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
    .replace(/<em>(.*?)<\/em>/g, "_$1_")
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, inner) =>
      inner.split("\n").map((l: string) => `> ${l.trim()}`).join("\n")
    )
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (_, inner) =>
      inner.replace(/<li>([\s\S]*?)<\/li>/g, "- $1\n").trim()
    )
    .replace(/<ol>([\s\S]*?)<\/ol>/g, (_, inner) => {
      let i = 0
      return inner.replace(/<li>([\s\S]*?)<\/li>/g, (_: string, li: string) => `${++i}. ${li}\n`).trim()
    })
    .replace(/<li>([\s\S]*?)<\/li>/g, "- $1\n")
    .replace(/<p>([\s\S]*?)<\/p>/g, "\n$1\n")
    .replace(/<[^>]+>/g, "")           // strip any remaining tags
    .replace(/\n{3,}/g, "\n\n")        // collapse extra blank lines
    .trim()
}

async function main() {
// ─── Import definitions ──────────────────────────────────────
const {
  AI_OPERATOR_MODULES,
  INTERMEDIATE_SALES_MARKETING_LESSONS,
  ADVANCED_DEV_TOOLS_LESSONS,
} = await import("../src/lib/mighty/content-pipeline.js")

const now = new Date().toISOString().slice(0, 10)

// ─── Build CONTENT-FULL.md ───────────────────────────────────
const lines: string[] = []

lines.push(`# AI Operator Collective — Full Content for Team Review`)
lines.push(``)
lines.push(`_Regenerated ${now} from \`src/lib/mighty/content-pipeline.ts\`. All 21 core lessons enriched with operator Q&A content. 6 new lessons added to previously empty sections._`)
lines.push(``)
lines.push(`**12 sections · 43 lessons** (37 updated + 6 new).`)
lines.push(``)
lines.push(`**Live link:** https://aioperatorcollective.mn.co/posts/curriculum-playbooks-ai-operator-playbook`)
lines.push(``)
lines.push(`---`)
lines.push(``)
lines.push(`## AI Operator Playbook`)
lines.push(``)
lines.push(`### Welcome to the AI Operator Playbook`)
lines.push(``)
lines.push(`This is the complete curriculum for launching, running, and scaling a profitable AI operator practice. Built by Ryan Jones and Adam Wolfe from real experience building AI solutions for businesses.`)
lines.push(``)
lines.push(`#### What You Will Get`)
lines.push(``)
lines.push(`- **Proven frameworks.** Not theory. Every lesson comes from real client work and real revenue.`)
lines.push(`- **Actionable playbooks.** Step-by-step systems you can implement this week.`)
lines.push(`- **Community support.** Your fellow operators are building alongside you. Share wins, ask questions, get feedback.`)
lines.push(``)
lines.push(`#### How This Course Works`)
lines.push(``)
lines.push(`**Module 1: AI Operator Foundations** — Who you are, who you serve, how you price.`)
lines.push(``)
lines.push(`**Module 2: Client Acquisition** — Finding clients, running discovery calls, closing deals.`)
lines.push(``)
lines.push(`**Module 3: AI Implementation Playbooks** — The technical playbooks for delivering results.`)
lines.push(``)
lines.push(`**Module 4: Scaling Your Practice** — Systems, hiring, brand, and growth.`)
lines.push(``)
lines.push(`---`)
lines.push(``)

// Core modules from AI_OPERATOR_MODULES
for (const mod of AI_OPERATOR_MODULES) {
  lines.push(`## ${mod.name}`)
  lines.push(``)

  for (const section of mod.sections) {
    lines.push(`### ${section.title}`)
    lines.push(``)

    for (let i = 0; i < section.lessons.length; i++) {
      const lesson = section.lessons[i]
      lines.push(`#### ${i + 1}. ${lesson.title}`)
      lines.push(``)
      lines.push(htmlToMd(lesson.description))
      lines.push(``)
      lines.push(`---`)
      lines.push(``)
    }
  }
}

// Intermediate: AI-Powered Sales and Marketing (new lessons)
lines.push(`## Intermediate: AI-Powered Sales and Marketing`)
lines.push(``)
lines.push(`> _Section previously empty. 3 lessons added ${now}._`)
lines.push(``)

for (let i = 0; i < INTERMEDIATE_SALES_MARKETING_LESSONS.length; i++) {
  const lesson = INTERMEDIATE_SALES_MARKETING_LESSONS[i]
  lines.push(`#### ${i + 1}. ${lesson.title}`)
  lines.push(``)
  lines.push(htmlToMd(lesson.description))
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
}

// Advanced: Building with AI Development Tools (new lessons)
lines.push(`## Advanced: Building with AI Development Tools`)
lines.push(``)
lines.push(`> _Section previously empty. 3 lessons added ${now}._`)
lines.push(``)

for (let i = 0; i < ADVANCED_DEV_TOOLS_LESSONS.length; i++) {
  const lesson = ADVANCED_DEV_TOOLS_LESSONS[i]
  lines.push(`#### ${i + 1}. ${lesson.title}`)
  lines.push(``)
  lines.push(htmlToMd(lesson.description))
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
}

// Note about sections not in pipeline definition
lines.push(`---`)
lines.push(``)
lines.push(`## Sections Not Included in This Export`)
lines.push(``)
lines.push(`The following sections exist in the community and were not modified in this update session. Content remains as originally published.`)
lines.push(``)
lines.push(`- **Beginner: AI for Your Business** (4 lessons)`)
lines.push(`- **Beginner: Finding and Landing Clients** (3 lessons)`)
lines.push(`- **Beginner: Marketing Yourself as an AI Operator** (1 lesson)`)
lines.push(`- **Intermediate: Automation Playbooks** (2 lessons)`)
lines.push(`- **Intermediate: Pricing, Packaging, and Go-to-Market** (2 lessons)`)
lines.push(`- **Case Study Library: Real AI Projects** (4 lessons)`)
lines.push(``)
lines.push(`_To update these sections, add their lesson definitions to \`AI_OPERATOR_MODULES\` in \`content-pipeline.ts\` and re-run \`scripts/push-content.ts\`._`)
lines.push(``)

const fullContent = lines.join("\n")
writeFileSync(
  resolve(process.cwd(), "docs/mighty/CONTENT-FULL.md"),
  fullContent,
  "utf-8"
)
console.log(`Wrote docs/mighty/CONTENT-FULL.md (${fullContent.split("\n").length} lines)`)

// ─── Build CONTENT-INVENTORY.md ──────────────────────────────
const inv: string[] = []

inv.push(`# AI Operator Collective — Mighty Networks Content Inventory`)
inv.push(``)
inv.push(`**Source:** Regenerated from \`src/lib/mighty/content-pipeline.ts\` (live push ${now})`)
inv.push(`**Generated:** ${now}`)
inv.push(``)
inv.push(`**Totals:** 12 sections · 43 lessons (37 updated + 6 new)`)
inv.push(``)

// Core modules
for (const mod of AI_OPERATOR_MODULES) {
  const lessonCount = mod.sections.reduce((n, s) => n + s.lessons.length, 0)
  inv.push(`## ${mod.name}  ·  _${lessonCount} lessons_`)
  inv.push(``)
  let num = 1
  for (const section of mod.sections) {
    inv.push(`### ${section.title}`)
    inv.push(``)
    for (const lesson of section.lessons) {
      const preview = htmlToMd(lesson.description).replace(/#+\s/g, "").slice(0, 80).replace(/\n/g, " ").trim()
      inv.push(`${num}. **${lesson.title}**`)
      inv.push(`   ${preview}…`)
      num++
    }
    inv.push(``)
  }
}

// New sections
inv.push(`## Intermediate: AI-Powered Sales and Marketing  ·  _3 lessons (NEW)_`)
inv.push(``)
INTERMEDIATE_SALES_MARKETING_LESSONS.forEach((l, i) => {
  const preview = htmlToMd(l.description).replace(/#+\s/g, "").slice(0, 80).replace(/\n/g, " ").trim()
  inv.push(`${i + 1}. **${l.title}**`)
  inv.push(`   ${preview}…`)
})
inv.push(``)

inv.push(`## Advanced: Building with AI Development Tools  ·  _3 lessons (NEW)_`)
inv.push(``)
ADVANCED_DEV_TOOLS_LESSONS.forEach((l, i) => {
  const preview = htmlToMd(l.description).replace(/#+\s/g, "").slice(0, 80).replace(/\n/g, " ").trim()
  inv.push(`${i + 1}. **${l.title}**`)
  inv.push(`   ${preview}…`)
})
inv.push(``)

// Unchanged sections
inv.push(`## Beginner: AI for Your Business  ·  _4 lessons (unchanged)_`)
inv.push(``)
inv.push(`## Beginner: Finding and Landing Clients  ·  _3 lessons (unchanged)_`)
inv.push(``)
inv.push(`## Beginner: Marketing Yourself as an AI Operator  ·  _1 lesson (unchanged)_`)
inv.push(``)
inv.push(`## Intermediate: Automation Playbooks  ·  _2 lessons (unchanged)_`)
inv.push(``)
inv.push(`## Intermediate: Pricing, Packaging, and Go-to-Market  ·  _2 lessons (unchanged)_`)
inv.push(``)
inv.push(`## Case Study Library: Real AI Projects  ·  _4 lessons (unchanged)_`)
inv.push(``)

inv.push(`---`)
inv.push(`## Section roll-up`)
inv.push(``)
inv.push(`| Section | Lessons | Status |`)
inv.push(`|---|---:|---|`)
inv.push(`| Module 1: AI Operator Foundations | 5 | updated ${now} |`)
inv.push(`| Module 2: Client Acquisition | 5 | updated ${now} |`)
inv.push(`| Module 3: AI Implementation Playbooks | 6 | updated ${now} |`)
inv.push(`| Module 4: Scaling Your Practice | 5 | updated ${now} |`)
inv.push(`| Intermediate: AI-Powered Sales and Marketing | 3 | new ${now} |`)
inv.push(`| Advanced: Building with AI Development Tools | 3 | new ${now} |`)
inv.push(`| Beginner: AI for Your Business | 4 | unchanged |`)
inv.push(`| Beginner: Finding and Landing Clients | 3 | unchanged |`)
inv.push(`| Beginner: Marketing Yourself as an AI Operator | 1 | unchanged |`)
inv.push(`| Intermediate: Automation Playbooks | 2 | unchanged |`)
inv.push(`| Intermediate: Pricing, Packaging, and Go-to-Market | 2 | unchanged |`)
inv.push(`| Case Study Library: Real AI Projects | 4 | unchanged |`)
inv.push(`| **TOTAL** | **43** | |`)

const invContent = inv.join("\n")
writeFileSync(
  resolve(process.cwd(), "docs/mighty/CONTENT-INVENTORY.md"),
  invContent,
  "utf-8"
)
console.log(`Wrote docs/mighty/CONTENT-INVENTORY.md (${invContent.split("\n").length} lines)`)
console.log(`\nDone. Both docs ready to commit.`)
} // end main

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
