import { db } from "@/lib/db"

const RESERVED = new Set([
  "admin",
  "api",
  "audit",
  "audits",
  "new",
  "preview",
  "settings",
  "edit",
  "share",
])

function baseSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "audit"
  )
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

// Generate a unique, URL-safe slug for a quiz. Tries the cleaned title first,
// then appends short suffixes until the DB confirms uniqueness.
export async function generateUniqueSlug(seed: string): Promise<string> {
  let candidate = baseSlug(seed)
  if (RESERVED.has(candidate)) candidate = `${candidate}-${randomSuffix()}`

  for (let attempt = 0; attempt < 8; attempt++) {
    const existing = await db.auditQuiz.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
    candidate = `${baseSlug(seed)}-${randomSuffix()}`
  }

  // Last-resort fallback — vanishingly unlikely to collide.
  return `${baseSlug(seed)}-${Date.now().toString(36)}`
}
