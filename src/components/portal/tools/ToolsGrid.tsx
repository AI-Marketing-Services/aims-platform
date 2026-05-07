"use client"

import { useState } from "react"
import { ExternalLink, Lock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tool, ToolCategory, UnlockGate } from "@/lib/tools/manifest"

/**
 * Tiered logo sources. Clearbit's free logo API was retired by HubSpot in
 * late 2024, so we lead with Google's favicon endpoint (which serves the
 * real hi-res favicon every modern SaaS ships in their HTML), then fall
 * back to DuckDuckGo before showing initials.
 *
 * Each entry returns a fully-qualified URL for a given domain.
 */
const LOGO_SOURCES: Array<(domain: string) => string> = [
  (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  (domain) => `https://logo.clearbit.com/${domain}`,
]

interface ToolsGridProps {
  tools: Tool[]
  categories: Record<ToolCategory, { label: string; description: string }>
  unlockedGates: string[]
}

const BADGE_COLORS: Record<string, string> = {
  New: "bg-primary text-primary-foreground border border-primary",
  Popular: "bg-primary/10 text-primary border border-primary/30",
  Beta: "bg-muted text-muted-foreground border border-border",
}

// All categories share a muted neutral avatar; the icon does the work.
// Keeps the grid feeling cohesive instead of confetti-coded.
const CATEGORY_AVATAR: Record<string, string> = {
  automation: "bg-muted text-muted-foreground",
  outreach: "bg-muted text-muted-foreground",
  content: "bg-muted text-muted-foreground",
  research: "bg-muted text-muted-foreground",
  finance: "bg-muted text-muted-foreground",
  ops: "bg-muted text-muted-foreground",
}

const GATE_LABELS: Record<UnlockGate, string> = {
  free: "Free access",
  "onboarding:50": "Complete 50% of onboarding to unlock",
  "onboarding:100": "Complete all onboarding steps to unlock",
  "crm:active_deal": "Land your first active client to unlock",
}

const ALL_CATEGORY = "__all__"

export function ToolsGrid({ tools, categories, unlockedGates }: ToolsGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [showLocked, setShowLocked] = useState(true)

  const unlockedSet = new Set(unlockedGates)

  const filtered = tools.filter((t) => {
    const matchCategory = activeCategory === ALL_CATEGORY || t.category === activeCategory
    const matchLocked = showLocked || unlockedSet.has(t.gate)
    return matchCategory && matchLocked
  })

  const categoryKeys = Object.keys(categories) as ToolCategory[]

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(ALL_CATEGORY)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              activeCategory === ALL_CATEGORY
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground hover:border-border"
            )}
          >
            All tools
          </button>
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                activeCategory === cat
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground hover:border-border"
              )}
            >
              {categories[cat].label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowLocked(!showLocked)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
        >
          <Lock className="h-3 w-3" />
          {showLocked ? "Hide locked" : "Show locked"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((tool) => {
          const isUnlocked = unlockedSet.has(tool.gate)
          return (
            <ToolCard
              key={tool.id}
              tool={tool}
              isUnlocked={isUnlocked}
              gateLabel={GATE_LABELS[tool.gate]}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tools match this filter.</p>
        </div>
      )}
    </div>
  )
}

function ToolLogo({ tool, isUnlocked }: { tool: Tool; isUnlocked: boolean }) {
  // Walk through LOGO_SOURCES in order, bumping the index every time the
  // current source 404s. When we exhaust the list, render initials.
  const [sourceIdx, setSourceIdx] = useState(0)
  const exhausted = sourceIdx >= LOGO_SOURCES.length

  const avatarClass = CATEGORY_AVATAR[tool.category] ?? "bg-gray-100 text-gray-600"
  const initials = tool.name.slice(0, 2).toUpperCase()

  if (!exhausted) {
    const src = LOGO_SOURCES[sourceIdx](tool.logoDomain)
    return (
      <div
        className={cn(
          "h-9 w-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-border/30",
          !isUnlocked && "grayscale",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${tool.name} logo`}
          width={36}
          height={36}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="object-contain w-full h-full"
          onError={() => setSourceIdx((i) => i + 1)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
        avatarClass,
      )}
    >
      {initials}
    </div>
  )
}

function ToolCard({
  tool,
  isUnlocked,
  gateLabel,
}: {
  tool: Tool
  isUnlocked: boolean
  gateLabel: string
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-4 transition-all duration-150",
        isUnlocked
          ? "bg-card border-border hover:border-primary/30 hover:shadow-sm"
          : "bg-muted/20 border-border/40 opacity-60"
      )}
    >
      {/* Lock indicator */}
      {!isUnlocked && (
        <div className="absolute top-3 right-3">
          <div className="h-6 w-6 rounded-full bg-background border border-border/60 flex items-center justify-center">
            <Lock className="h-3 w-3 text-muted-foreground/60" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <ToolLogo tool={tool} isUnlocked={isUnlocked} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3
              className={cn(
                "text-sm font-semibold",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {tool.name}
            </h3>
            {tool.badge && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  BADGE_COLORS[tool.badge]
                )}
              >
                {tool.badge}
              </span>
            )}
            {tool.isPaid && (
              <span className="text-[10px] text-muted-foreground">Paid</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tool.tagline}</p>
        </div>
      </div>

      {/* Description */}
      <p
        className={cn(
          "text-xs leading-relaxed flex-1 mb-4",
          isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"
        )}
      >
        {isUnlocked ? tool.description : gateLabel}
      </p>

      {/* Footer */}
      <div className="pt-3 border-t border-border/50">
        {isUnlocked ? (
          <a
            href={tool.affiliateUrl ?? tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open tool
          </a>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Sparkles className="h-3 w-3" />
            Unlock by completing more steps
          </div>
        )}
      </div>
    </div>
  )
}
