import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const BASE = "https://aimseos.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/marketplace`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/why-aims`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/get-started`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/industries/vendingpreneurs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/features/ultimate-vendingpreneur-snapshot`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/tools/ai-readiness-quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/roi-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/website-audit`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sign-in`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/sign-up`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ]

  // Dynamic service pages
  let servicePages: MetadataRoute.Sitemap = []
  try {
    const services = await db.serviceArm.findMany({
      where: { status: { in: ["ACTIVE", "BETA"] } },
      select: { slug: true, updatedAt: true },
    })
    servicePages = services.map((s) => ({
      url: `${BASE}/services/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  } catch {}

  return [...staticPages, ...servicePages]
}
