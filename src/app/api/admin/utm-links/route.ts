import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"

function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

const BOOKED_STAGES: DealStage[] = [
  DealStage.CONSULT_BOOKED,
  DealStage.CONSULT_COMPLETED,
  DealStage.MIGHTY_INVITED,
  DealStage.MEMBER_JOINED,
]

function buildFullUrl(
  baseUrl: string,
  link: {
    utmSource: string
    utmMedium: string
    utmCampaign: string
    utmContent?: string | null
    utmTerm?: string | null
  }
) {
  const url = new URL(baseUrl)
  url.searchParams.set("utm_source", link.utmSource)
  url.searchParams.set("utm_medium", link.utmMedium)
  url.searchParams.set("utm_campaign", link.utmCampaign)
  if (link.utmContent) url.searchParams.set("utm_content", link.utmContent)
  if (link.utmTerm) url.searchParams.set("utm_term", link.utmTerm)
  return url.toString()
}

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const [links, allDeals, allPartials, pageviewGroups] = await Promise.all([
      db.utmLink.findMany({ orderBy: { createdAt: "desc" } }),
      db.deal.findMany({
        where: { utmSource: { not: null } },
        select: { utmSource: true, utmMedium: true, utmCampaign: true, stage: true },
      }),
      db.partialApplication.findMany({
        where: { utmSource: { not: null }, completedAt: null },
        select: { utmSource: true, utmMedium: true, utmCampaign: true },
      }),
      db.pageView.groupBy({
        by: ["utmSource", "utmMedium", "utmCampaign"],
        _count: { id: true },
        where: { utmSource: { not: null } },
      }),
    ])

    const result = links.map((link) => {
      const matchDeal = (d: {
        utmSource: string | null
        utmMedium: string | null
        utmCampaign: string | null
      }) =>
        d.utmSource === link.utmSource &&
        d.utmMedium === link.utmMedium &&
        d.utmCampaign === link.utmCampaign

      const deals = allDeals.filter(matchDeal)
      const partials = allPartials.filter(matchDeal)
      const pvGroup = pageviewGroups.find(
        (g) =>
          g.utmSource === link.utmSource &&
          g.utmMedium === link.utmMedium &&
          g.utmCampaign === link.utmCampaign
      )

      return {
        ...link,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
        fullUrl: buildFullUrl(link.baseUrl, link),
        stats: {
          pageviews: pvGroup?._count.id ?? 0,
          partials: partials.length,
          applications: deals.length,
          booked: deals.filter((d) => BOOKED_STAGES.includes(d.stage)).length,
          members: deals.filter((d) => d.stage === "MEMBER_JOINED").length,
        },
      }
    })

    return NextResponse.json({ links: result })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  channel: z.string().min(1).max(40),
  utmSource: z.string().min(1).max(80),
  utmMedium: z.string().min(1).max(80),
  utmCampaign: z.string().min(1).max(150),
  utmContent: z.string().max(150).optional(),
  utmTerm: z.string().max(150).optional(),
})

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const link = await db.utmLink.create({ data: parsed.data })
    return NextResponse.json(
      {
        link: {
          ...link,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
          fullUrl: buildFullUrl(link.baseUrl, link),
        },
      },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
