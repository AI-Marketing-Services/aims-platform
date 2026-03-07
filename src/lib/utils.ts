import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const PILLAR_CONFIG = {
  MARKETING: {
    label: "Marketing",
    color: "#16A34A",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: "Megaphone",
  },
  SALES: {
    label: "Sales",
    color: "#2563EB",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    icon: "TrendingUp",
  },
  OPERATIONS: {
    label: "Operations",
    color: "#EA580C",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    icon: "Settings",
  },
  FINANCE: {
    label: "Finance",
    color: "#9333EA",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    icon: "DollarSign",
  },
} as const

export const DEAL_STAGE_CONFIG = {
  NEW_LEAD: { label: "New Lead", color: "bg-gray-100 text-gray-700" },
  QUALIFIED: { label: "Qualified", color: "bg-blue-100 text-blue-700" },
  DEMO_BOOKED: { label: "Demo Booked", color: "bg-indigo-100 text-indigo-700" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "bg-yellow-100 text-yellow-800" },
  NEGOTIATION: { label: "Negotiation", color: "bg-amber-100 text-amber-800" },
  ACTIVE_CLIENT: { label: "Active Client", color: "bg-green-100 text-green-700" },
  UPSELL_OPPORTUNITY: { label: "Upsell", color: "bg-emerald-100 text-emerald-700" },
  AT_RISK: { label: "At Risk", color: "bg-red-100 text-red-700" },
  CHURNED: { label: "Churned", color: "bg-red-200 text-red-800" },
  LOST: { label: "Lost", color: "bg-gray-200 text-gray-600" },
} as const

export const FULFILLMENT_STATUS_CONFIG = {
  PENDING_SETUP: { label: "Pending Setup", color: "bg-yellow-100 text-yellow-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  ACTIVE_MANAGED: { label: "Active", color: "bg-green-100 text-green-700" },
  NEEDS_ATTENTION: { label: "Needs Attention", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  ON_HOLD: { label: "On Hold", color: "bg-gray-100 text-gray-500" },
} as const

// Team assignment map — maps service arm slugs to default assignees
export const FULFILLMENT_ASSIGNMENTS: Record<string, { name: string; slackId?: string }> = {
  "website-crm-chatbot": { name: "Sabbir" },
  "seo-aeo": { name: "Cody" },
  "cold-outbound": { name: "Marco" },
  "voice-agents": { name: "Ivan" },
  "content-production": { name: "Ailyn" },
  "revops-pipeline": { name: "Maureen" },
  "audience-targeting": { name: "Saad" },
  "lead-reactivation": { name: "Kumar" },
  "database-reactivation": { name: "Maureen" },
  "pixel-intelligence": { name: "Kumar" },
  "finance-automation": { name: "Adam" },
  "ai-tool-tracker": { name: "Adam" },
  "vending-placement-visualizer": { name: "Adam" },
}
