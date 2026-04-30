import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

/**
 * GET /api/portal/crm/duplicates
 *
 * Returns clusters of likely-duplicate ClientDeals owned by the current
 * operator. Two heuristics:
 *   1. Same lowercased companyName (canonical)
 *   2. Same lowercased contactEmail
 *
 * Each cluster surfaces the deals so the operator can pick a canonical
 * one and merge the rest into it.
 *
 * Cheap: single query, in-memory bucketing, no AI. Runs on every visit
 * to the CRM page.
 */
export async function GET() {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deals = await db.clientDeal.findMany({
    where: { userId: dbUserId },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      stage: true,
      value: true,
      currency: true,
      leadScore: true,
      lastEnrichedAt: true,
      updatedAt: true,
      _count: { select: { contacts: true, activities: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  type DealLite = (typeof deals)[number]
  const byName = new Map<string, DealLite[]>()
  const byEmail = new Map<string, DealLite[]>()

  for (const d of deals) {
    const nameKey = d.companyName.trim().toLowerCase()
    if (nameKey) {
      const arr = byName.get(nameKey) ?? []
      arr.push(d)
      byName.set(nameKey, arr)
    }
    const emailKey = d.contactEmail?.trim().toLowerCase()
    if (emailKey) {
      const arr = byEmail.get(emailKey) ?? []
      arr.push(d)
      byEmail.set(emailKey, arr)
    }
  }

  const clusters: Array<{
    matchType: "companyName" | "contactEmail"
    matchValue: string
    deals: Array<{
      id: string
      companyName: string
      contactEmail: string | null
      stage: string
      value: number
      currency: string
      leadScore: number | null
      lastEnrichedAt: string | null
      updatedAt: string
      contactCount: number
      activityCount: number
    }>
  }> = []

  for (const [name, arr] of byName.entries()) {
    if (arr.length < 2) continue
    clusters.push({
      matchType: "companyName",
      matchValue: name,
      deals: arr.map((d) => ({
        id: d.id,
        companyName: d.companyName,
        contactEmail: d.contactEmail,
        stage: d.stage,
        value: d.value,
        currency: d.currency,
        leadScore: d.leadScore,
        lastEnrichedAt: d.lastEnrichedAt?.toISOString() ?? null,
        updatedAt: d.updatedAt.toISOString(),
        contactCount: d._count.contacts,
        activityCount: d._count.activities,
      })),
    })
  }

  // Email clusters that aren't already covered by a name cluster
  const seenIds = new Set(clusters.flatMap((c) => c.deals.map((d) => d.id)))
  for (const [email, arr] of byEmail.entries()) {
    if (arr.length < 2) continue
    const novel = arr.filter((d) => !seenIds.has(d.id))
    if (novel.length < 2) continue
    clusters.push({
      matchType: "contactEmail",
      matchValue: email,
      deals: novel.map((d) => ({
        id: d.id,
        companyName: d.companyName,
        contactEmail: d.contactEmail,
        stage: d.stage,
        value: d.value,
        currency: d.currency,
        leadScore: d.leadScore,
        lastEnrichedAt: d.lastEnrichedAt?.toISOString() ?? null,
        updatedAt: d.updatedAt.toISOString(),
        contactCount: d._count.contacts,
        activityCount: d._count.activities,
      })),
    })
  }

  return NextResponse.json({
    ok: true,
    clusters,
    duplicateCount: clusters.reduce(
      (sum, c) => sum + Math.max(0, c.deals.length - 1),
      0,
    ),
  })
}
