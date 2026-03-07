// Re-export Prisma types for convenience
export type {
  User,
  Deal,
  DealNote,
  DealActivity,
  DealServiceArm,
  ServiceArm,
  ServiceTier,
  Subscription,
  FulfillmentTask,
  LeadMagnetSubmission,
  Referral,
  InternProfile,
  InternTask,
  EODReport,
  SprintGoal,
  Notification,
  SupportTicket,
  SupportResponse,
  VendorTracker,
  ApiCostLog,
  PageView,
} from "@prisma/client"

export type {
  UserRole,
  DealStage,
  DealPriority,
  ActivityType,
  ServicePillar,
  ServiceStatus,
  PricingModel,
  DemoType,
  SubStatus,
  FulfillmentStatus,
  LeadMagnetType,
  ReferralTier,
  InternRole,
  InternStatus,
  TaskStatus,
  NotificationChannel,
} from "@prisma/client"

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============ ADMIN METRICS ============

export interface AdminMetrics {
  mrr: number
  activeClients: number
  newLeadsThisMonth: number
  newLeadsLastMonth: number
  leadGrowth: number
  activeSubs: number
  dealsByStage: Array<{
    stage: string
    count: number
    value: number
  }>
  mrrByArm: Array<{
    serviceArmId: string
    _sum: { monthlyAmount: number | null }
    _count: number
  }>
  recentActivities: Array<{
    id: string
    type: string
    detail: string | null
    createdAt: Date
    deal: {
      contactName: string
      company: string | null
      stage: string
    }
  }>
}

export interface ApiCostSummary {
  total: number
  byProvider: Array<{
    provider: string
    cost: number
    calls: number
  }>
  byServiceArm: Array<{
    serviceArm: string | null
    cost: number
    calls: number
  }>
}

// ============ LEAD MAGNET TYPES ============

export interface QuizAnswers {
  [key: string]: number // q1 through q10, values 1-5
}

export interface QuizResults {
  overall: number
  pillars: Record<string, number>
  weakest: string
  strongest: string
}

export interface ROIInputs {
  locations: number
  employees: number
  avgSalary: number
  closeRate: number
  industry: string
}

export interface ROIResults {
  monthlyCostManual: number
  projectedAIMSCost: number
  monthlySavings: number
  annualSavings: number
  paybackPeriodMonths: number
  costOfWaiting: number
  locations: number
  industry: string
}

export interface AuditResults {
  overallScore: number
  categories: {
    seo: { score: number; issues: AuditIssue[] }
    aeo: { score: number; issues: AuditIssue[] }
    conversion: { score: number; issues: AuditIssue[] }
    mobile: { score: number; issues: AuditIssue[] }
    performance: { score: number; issues: AuditIssue[] }
  }
  topFixes: string[]
  aimsRecommendations: Array<{
    service: string
    reason: string
  }>
}

export interface AuditIssue {
  title: string
  severity: "high" | "medium" | "low"
  fix: string
}

// ============ CHECKOUT ============

export interface CheckoutParams {
  serviceArmSlug: string
  tier: string
  metadata?: Record<string, string>
}
