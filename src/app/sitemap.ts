import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { getAllSlugs } from "@/lib/blog"

const BASE = "https://aimseos.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/marketplace`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
{ url: `${BASE}/why-aims`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/get-started`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // Industries
    { url: `${BASE}/industries/vendingpreneurs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/industries/car-dealerships`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/industries/small-business`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/industries/hotels-hospitality`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/industries/enterprise`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // Case studies
    { url: `${BASE}/case-studies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/case-studies/ford-dealership`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/case-studies/vendingpreneur`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/case-studies/pl-automation`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Blog
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // Tools
    { url: `${BASE}/tools/ai-readiness-quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/roi-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/website-audit`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/segment-explorer`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/stack-configurator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/dashboard`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    // About & solutions
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/solutions`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/crm-onboarding`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    // Auth
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

  // Blog posts
  const blogSlugs = getAllSlugs()
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...servicePages, ...blogPages]
}
