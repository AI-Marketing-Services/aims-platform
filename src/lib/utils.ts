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

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const FULFILLMENT_STATUS_CONFIG = {
  PENDING_SETUP: { label: "Pending Setup", color: "bg-yellow-900/20 text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-900/20 text-blue-400" },
  ACTIVE_MANAGED: { label: "Active", color: "bg-green-900/20 text-green-400" },
  NEEDS_ATTENTION: { label: "Needs Attention", color: "bg-red-900/20 text-red-400" },
  COMPLETED: { label: "Completed", color: "bg-deep text-muted-foreground" },
  ON_HOLD: { label: "On Hold", color: "bg-deep text-muted-foreground" },
} as const
