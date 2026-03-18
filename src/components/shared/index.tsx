"use client"

import { cn, PILLAR_CONFIG, DEAL_STAGE_CONFIG, FULFILLMENT_STATUS_CONFIG } from "@/lib/utils"

type ServicePillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"
type DealStage = keyof typeof DEAL_STAGE_CONFIG
type FulfillmentStatus = keyof typeof FULFILLMENT_STATUS_CONFIG

// ============ PILLAR BADGE ============

export function PillarBadge({
  pillar,
  size = "sm",
}: {
  pillar: ServicePillar
  size?: "sm" | "md"
}) {
  const config = PILLAR_CONFIG[pillar]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  )
}

// ============ STATUS BADGES ============

export function DealStageBadge({ stage }: { stage: DealStage }) {
  const config = DEAL_STAGE_CONFIG[stage]
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", config.color)}>
      {config.label}
    </span>
  )
}

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const config = FULFILLMENT_STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", config.color)}>
      {config.label}
    </span>
  )
}

export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string
  variant?: "default" | "success" | "warning" | "danger" | "info"
}) {
  const colors = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  }

  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", colors[variant])}>
      {status}
    </span>
  )
}

// ============ METRIC CARD ============

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
}: {
  label: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight font-mono">{value}</p>
      {change !== undefined && (
        <p className="mt-1 text-xs">
          <span className={cn("font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-muted-foreground ml-1">{changeLabel}</span>
          )}
        </p>
      )}
    </div>
  )
}
