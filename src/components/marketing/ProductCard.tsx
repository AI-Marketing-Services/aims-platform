"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { cn, formatCurrency, PILLAR_CONFIG } from "@/lib/utils"

interface Service {
  slug: string
  name: string
  shortDesc: string
  pillar: "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"
  status: "ACTIVE" | "COMING_SOON" | "BETA" | "INTERNAL_ONLY" | "DEPRECATED"
  pricingModel: string
  basePrice?: number | null
  iconName?: string | null
  isFeatured?: boolean
}

interface ProductCardProps {
  service: Service
}

export function ProductCard({ service }: ProductCardProps) {
  const { slug, name, shortDesc, pillar, status, pricingModel, basePrice, isFeatured } = service

  const pillarConfig = PILLAR_CONFIG[pillar]

  const priceDisplay = (() => {
    if (pricingModel === "CUSTOM") return "Custom pricing"
    if (pricingModel === "QUARTERLY" && basePrice) return `${formatCurrency(basePrice)}/quarter`
    if (basePrice) return `From ${formatCurrency(basePrice)}/mo`
    return "Contact us"
  })()

  return (
    <Link
      href={`/services/${slug}`}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-white p-6 card-hover",
        isFeatured ? "border-red-200 shadow-sm" : "border-border"
      )}
    >
      {/* Pillar + status badges */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            pillarConfig.bgColor,
            pillarConfig.textColor
          )}
        >
          {pillarConfig.label}
        </span>
        {status === "COMING_SOON" && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        )}
        {status === "BETA" && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Beta
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg mb-4", pillarConfig.bgColor)}>
        <Zap className={cn("h-5 w-5", pillarConfig.textColor)} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground group-hover:text-red-600 transition-colors">
        {name}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {shortDesc}
      </p>

      {/* Price + CTA */}
      <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm font-semibold text-foreground">{priceDisplay}</span>
        <span className="text-xs font-medium text-red-600 group-hover:underline">
          {status === "ACTIVE" || status === "BETA" ? "Learn more →" : "Notify me →"}
        </span>
      </div>
    </Link>
  )
}
