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
    color: "#C4972A",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
    icon: "Megaphone",
  },
  SALES: {
    label: "Sales",
    color: "#A17D22",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
    icon: "TrendingUp",
  },
  OPERATIONS: {
    label: "Operations",
    color: "#D4A83A",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
    icon: "Settings",
  },
  FINANCE: {
    label: "Finance",
    color: "#E8C46A",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
    icon: "DollarSign",
  },
} as const

export const DEAL_STAGE_CONFIG = {
  NEW_LEAD: { label: "New Lead", color: "bg-deep text-foreground" },
  QUALIFIED: { label: "Qualified", color: "bg-blue-900/20 text-blue-400" },
  DEMO_BOOKED: { label: "Demo Booked", color: "bg-indigo-900/20 text-indigo-400" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "bg-yellow-900/20 text-yellow-400" },
  NEGOTIATION: { label: "Negotiation", color: "bg-amber-900/20 text-amber-400" },
  ACTIVE_CLIENT: { label: "Active Client", color: "bg-green-900/20 text-green-400" },
  UPSELL_OPPORTUNITY: { label: "Upsell", color: "bg-emerald-900/20 text-emerald-400" },
  AT_RISK: { label: "At Risk", color: "bg-red-900/20 text-red-400" },
  CHURNED: { label: "Churned", color: "bg-red-900/30 text-red-400" },
  LOST: { label: "Lost", color: "bg-surface text-muted-foreground" },
} as const

export const FULFILLMENT_STATUS_CONFIG = {
  PENDING_SETUP: { label: "Pending Setup", color: "bg-yellow-900/20 text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-900/20 text-blue-400" },
  ACTIVE_MANAGED: { label: "Active", color: "bg-green-900/20 text-green-400" },
  NEEDS_ATTENTION: { label: "Needs Attention", color: "bg-red-900/20 text-red-400" },
  COMPLETED: { label: "Completed", color: "bg-deep text-muted-foreground" },
  ON_HOLD: { label: "On Hold", color: "bg-deep text-muted-foreground" },
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
