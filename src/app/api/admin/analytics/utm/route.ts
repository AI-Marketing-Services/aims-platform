import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"

const BOOKED_STAGES: DealStage[] = [
  DealStage.CONSULT_BOOKED,
  DealStage.CONSULT_COMPLETED,
  DealStage.MIGHTY_INVITED,
  DealStage.MEMBER_JOINED,
]

interface ChannelRow {
  source: string
  medium: string
  pageviews: number
  partials: number
  applications: number
  booked: number
  members: number
}

interface CampaignRow {
  campaign: string
  source: string
  medium: string
  pageviews: number
  applications: number
  booked: number
  members: number
}

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!["ADMIN", "SUPER_ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [deals, partials, pageviewGroups] = await Promise.all([
    db.deal.findMany({
      where: { utmSource: { not: null } },
      select: { utmSource: true, utmMedium: true, utmCampaign: true, stage: true },
    }),
    db.partialApplication.findMany({
      where: { utmSource: { not: null } },
      select: { utmSource: true, utmMedium: true, utmCampaign: true },
    }),
    db.pageView.groupBy({
      by: ["utmSource", "utmMedium", "utmCampaign"],
      _count: { id: true },
      where: { utmSource: { not: null } },
    }),
  ])

  // ── By Channel (source + medium) ──
  const channelMap = new Map<string, ChannelRow>()

  function getChannel(source: string | null, medium: string | null): ChannelRow {
    const src = source ?? "unknown"
    const med = medium ?? "unknown"
    const key = `${src}||${med}`
    if (!channelMap.has(key)) {
      channelMap.set(key, { source: src, medium: med, pageviews: 0, partials: 0, applications: 0, booked: 0, members: 0 })
    }
    return channelMap.get(key)!
  }

  for (const d of deals) {
    const row = getChannel(d.utmSource, d.utmMedium)
    row.applications++
    if (BOOKED_STAGES.includes(d.stage)) row.booked++
    if (d.stage === "MEMBER_JOINED") row.members++
  }
  for (const p of partials) {
    getChannel(p.utmSource, p.utmMedium).partials++
  }
  for (const pv of pageviewGroups) {
    getChannel(pv.utmSource, pv.utmMedium).pageviews += pv._count.id
  }

  const byChannel = Array.from(channelMap.values()).sort((a, b) => b.applications - a.applications)

  // ── By Campaign ──
  const campaignMap = new Map<string, CampaignRow>()

  function getCampaign(source: string | null, medium: string | null, campaign: string | null): CampaignRow {
    const src = source ?? "unknown"
    const med = medium ?? "unknown"
    const camp = campaign ?? "unknown"
    const key = `${src}||${med}||${camp}`
    if (!campaignMap.has(key)) {
      campaignMap.set(key, { campaign: camp, source: src, medium: med, pageviews: 0, applications: 0, booked: 0, members: 0 })
    }
    return campaignMap.get(key)!
  }

  for (const d of deals) {
    const row = getCampaign(d.utmSource, d.utmMedium, d.utmCampaign)
    row.applications++
    if (BOOKED_STAGES.includes(d.stage)) row.booked++
    if (d.stage === "MEMBER_JOINED") row.members++
  }
  for (const pv of pageviewGroups) {
    getCampaign(pv.utmSource, pv.utmMedium, pv.utmCampaign).pageviews += pv._count.id
  }

  const byCampaign = Array.from(campaignMap.values()).sort((a, b) => b.applications - a.applications)

  const totals = {
    pageviews: byChannel.reduce((s, r) => s + r.pageviews, 0),
    partials: byChannel.reduce((s, r) => s + r.partials, 0),
    applications: byChannel.reduce((s, r) => s + r.applications, 0),
    booked: byChannel.reduce((s, r) => s + r.booked, 0),
    members: byChannel.reduce((s, r) => s + r.members, 0),
  }

  return NextResponse.json({ byChannel, byCampaign, totals })
}
