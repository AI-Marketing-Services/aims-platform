"use client"

import { useState } from "react"
import { MapPin, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ScoutTabs — co-equal tabs for the two discovery modes:
 *   1. Google Maps (structured business data, dedups by place_id)
 *   2. Open web (Tavily-based, broader but less structured)
 *
 * Both surfaces are first-class — operators pick whichever matches the
 * prospect type they're hunting. Maps is faster + cheaper for known
 * categories ("HVAC in Austin"); web is better when the prospect type
 * doesn't map cleanly to a Google Places category.
 */
export function ScoutTabs({
  mapsContent,
  webContent,
}: {
  mapsContent: React.ReactNode
  webContent: React.ReactNode
}) {
  const [active, setActive] = useState<"maps" | "web">("maps")

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
        <TabButton
          active={active === "maps"}
          onClick={() => setActive("maps")}
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Google Maps"
          subLabel="Structured · 1 credit"
        />
        <TabButton
          active={active === "web"}
          onClick={() => setActive("web")}
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Open web"
          subLabel="Tavily · broader"
        />
      </div>

      <div className={cn(active === "maps" ? "block" : "hidden")}>
        {mapsContent}
      </div>
      <div
        className={cn(
          active === "web" ? "block" : "hidden",
          "rounded-2xl border border-border bg-card overflow-hidden h-[700px]",
        )}
      >
        {webContent}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  subLabel,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  subLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md text-left transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "text-[10px] mt-0.5",
          active ? "text-primary-foreground/80" : "text-muted-foreground/70",
        )}
      >
        {subLabel}
      </p>
    </button>
  )
}
