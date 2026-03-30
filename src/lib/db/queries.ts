import { db } from "./index"
import type {
  DealStage,
  DealPriority,
  ServicePillar,
  ServiceStatus,
  SubStatus,
  FulfillmentStatus,
  Prisma,
} from "@prisma/client"

// ============ DEALS ============

export async function getDeals(filters?: {
  stage?: DealStage
  assignedTo?: string
  channelTag?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const where: Prisma.DealWhereInput = {}

  if (filters?.stage) where.stage = filters.stage
  if (filters?.assignedTo) where.assignedTo = filters.assignedTo
  if (filters?.channelTag) where.channelTag = filters.channelTag
  if (filters?.search) {
    where.OR = [
      { contactName: { contains: filters.search, mode: "insensitive" } },
      { contactEmail: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  return db.deal.findMany({
    where,
    include: {
      serviceArms: { include: { serviceArm: true } },
      notes: { orderBy: { createdAt: "desc" }, take: 3 },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: filters?.limit ?? 50,
    skip: filters?.offset ?? 0,
  })
}

export async function getDealById(id: string) {
  return db.deal.findUnique({
    where: { id },
    include: {
      serviceArms: { include: { serviceArm: true } },
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          avatarUrl: true,
          phone: true,
          industry: true,
          website: true,
        },
      },
    },
  })
}

export async function getDealsByStage() {
  const STAGES: DealStage[] = [
    "NEW_LEAD",
    "QUALIFIED",
    "DEMO_BOOKED",
    "PROPOSAL_SENT",
    "NEGOTIATION",
    "ACTIVE_CLIENT",
    "UPSELL_OPPORTUNITY",
    "AT_RISK",
    "CHURNED",
    "LOST",
  ]

  const allDeals = await db.deal.findMany({
    where: { stage: { in: STAGES } },
    include: {
      serviceArms: { include: { serviceArm: { select: { name: true, pillar: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const byStage = new Map<DealStage, typeof allDeals>(STAGES.map((s) => [s, []]))
  for (const deal of allDeals) {
    byStage.get(deal.stage)?.push(deal)
  }

  return STAGES.map((stage) => {
    const deals = byStage.get(stage) ?? []
    return { stage, deals, count: deals.length, totalValue: deals.reduce((sum, d) => sum + d.value, 0) }
  })
}

export async function createDeal(data: {
  contactName: string
  contactEmail: string
  company?: string
  phone?: string
  industry?: string
  website?: string
  source?: string
  sourceDetail?: string
  channelTag?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  value?: number
  leadScore?: number
  leadScoreTier?: string
  leadScoreReason?: string
  priority?: DealPriority
}) {
  return db.deal.create({
    data: {
      ...data,
      value: data.value ?? 0,
      activities: {
        create: {
          type: "FORM_SUBMITTED",
          detail: `Lead created from ${data.source ?? "direct"}`,
        },
      },
    },
  })
}

export async function updateDealStage(
  dealId: string,
  stage: DealStage,
  authorId?: string
) {
  const deal = await db.deal.update({
    where: { id: dealId },
    data: {
      stage,
      closedAt: ["ACTIVE_CLIENT", "CHURNED", "LOST"].includes(stage)
        ? new Date()
        : undefined,
      activities: {
        create: {
          type: "STAGE_CHANGE",
          detail: `Moved to ${stage}`,
          authorId,
        },
      },
    },
  })
  return deal
}

// ============ SERVICES ============

export async function getServiceArms(filters?: {
  pillar?: ServicePillar
  status?: ServiceStatus
  featured?: boolean
}) {
  const where: Prisma.ServiceArmWhereInput = {}
  if (filters?.pillar) where.pillar = filters.pillar
  if (filters?.status) where.status = filters.status
  else where.status = { not: "DEPRECATED" }
  if (filters?.featured) where.isFeatured = true

  return db.serviceArm.findMany({
    where,
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  })
}

export async function getServiceArmBySlug(slug: string) {
  return db.serviceArm.findUnique({
    where: { slug },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  })
}

// ============ SUBSCRIPTIONS ============

export async function getSubscriptionsByUser(userId: string) {
  return db.subscription.findMany({
    where: { userId },
    include: {
      serviceArm: true,
      fulfillmentTasks: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getSubscriptionsForAdmin(filters?: {
  status?: SubStatus
  fulfillmentStatus?: FulfillmentStatus
  serviceArmId?: string
}) {
  const where: Prisma.SubscriptionWhereInput = {}
  if (filters?.status) where.status = filters.status
  if (filters?.fulfillmentStatus) where.fulfillmentStatus = filters.fulfillmentStatus
  if (filters?.serviceArmId) where.serviceArmId = filters.serviceArmId

  return db.subscription.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, company: true } },
      serviceArm: { select: { id: true, name: true, slug: true, pillar: true } },
      fulfillmentTasks: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

// ============ METRICS ============

export async function getAdminMetrics() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalMrr,
    activeClients,
    newLeadsThisMonth,
    newLeadsLastMonth,
    activeSubs,
    dealsByStage,
    mrrByArm,
    recentActivities,
  ] = await Promise.all([
    db.subscription.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyAmount: true },
    }),
    db.subscription.groupBy({
      by: ["userId"],
      where: { status: "ACTIVE" },
    }),
    db.deal.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    db.deal.count({
      where: {
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.deal.groupBy({
      by: ["stage"],
      _count: true,
      _sum: { value: true },
    }),
    db.subscription.groupBy({
      by: ["serviceArmId"],
      where: { status: "ACTIVE" },
      _sum: { monthlyAmount: true },
      _count: true,
    }),
    db.dealActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        deal: {
          select: { contactName: true, company: true, stage: true },
        },
      },
    }),
  ])

  return {
    mrr: totalMrr._sum.monthlyAmount ?? 0,
    activeClients: activeClients.length,
    newLeadsThisMonth,
    newLeadsLastMonth,
    leadGrowth:
      newLeadsLastMonth > 0
        ? ((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100
        : 0,
    activeSubs,
    dealsByStage: dealsByStage.map((d) => ({
      stage: d.stage,
      count: d._count,
      value: d._sum.value ?? 0,
    })),
    mrrByArm,
    recentActivities,
  }
}

export async function getApiCostSummary(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [byProvider, byServiceArm, total] = await Promise.all([
    db.apiCostLog.groupBy({
      by: ["provider"],
      where: { createdAt: { gte: since } },
      _sum: { cost: true },
      _count: true,
    }),
    db.apiCostLog.groupBy({
      by: ["serviceArm"],
      where: { createdAt: { gte: since }, serviceArm: { not: null } },
      _sum: { cost: true },
      _count: true,
    }),
    db.apiCostLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { cost: true },
    }),
  ])

  return {
    total: total._sum.cost ?? 0,
    byProvider: byProvider.map((p) => ({
      provider: p.provider,
      cost: p._sum.cost ?? 0,
      calls: p._count,
    })),
    byServiceArm: byServiceArm.map((s) => ({
      serviceArm: s.serviceArm,
      cost: s._sum.cost ?? 0,
      calls: s._count,
    })),
  }
}

// ============ LEAD MAGNETS ============

export async function createLeadMagnetSubmission(data: {
  type: "AI_READINESS_QUIZ" | "ROI_CALCULATOR" | "WEBSITE_AUDIT" | "SEGMENT_EXPLORER" | "STACK_CONFIGURATOR" | "BUSINESS_CREDIT_SCORE"
  email: string
  name?: string
  company?: string
  phone?: string
  data: Record<string, unknown>
  results?: Record<string, unknown>
  score?: number
  source?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}) {
  const submission = await db.leadMagnetSubmission.create({
    data: {
      type: data.type,
      email: data.email,
      name: data.name,
      company: data.company,
      phone: data.phone,
      data: data.data as Prisma.InputJsonValue,
      results: data.results as Prisma.InputJsonValue | undefined,
      score: data.score,
      source: data.source,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    },
  })
  return submission
}
