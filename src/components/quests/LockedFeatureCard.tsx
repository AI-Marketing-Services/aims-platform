"use client"

import Link from "next/link"
import { useQuests } from "./QuestContext"
import type { FeatureKey } from "@/lib/quests/registry"
import { Lock, ArrowRight } from "lucide-react"

interface Props {
  feature: FeatureKey
  /** Friendly feature label, e.g. "Lead Scout" */
  featureName: string
  /** Optional 1-line reason this feature exists */
  blurb?: string
  /** Children rendered when feature IS unlocked. */
  children: React.ReactNode
}

/**
 * Wrap any feature surface in <LockedFeatureCard> to get a graceful
 * "complete X to unlock" empty state when the user hasn't earned access yet.
 *
 * Use when an entire page should be gated. For inline gating (e.g. a button)
 * use the `useQuests().isFeatureUnlocked(feature)` hook directly.
 */
export function LockedFeatureCard({ feature, featureName, blurb, children }: Props) {
  const { progress, featureFlags, loading } = useQuests()

  // While loading, show children so we don't flash a locked state on a feature
  // the user has actually unlocked. Server-side rendering already enforces gates
  // for hard-locked sensitive operations.
  if (loading || !featureFlags) return <>{children}</>

  if (featureFlags[feature]) return <>{children}</>

  // Find the gating quest (if any).
  const gating = progress?.byCategory.main.find(
    (q) => q.unlocksFeatureKey === feature,
  )

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-card p-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Lock className="h-6 w-6" />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">
        Locked
      </p>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {featureName}
      </h2>
      {blurb ? (
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          {blurb}
        </p>
      ) : null}

      {gating ? (
        <div className="max-w-sm mx-auto rounded-xl border border-border bg-deep/40 p-5 text-left mb-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
            Complete this quest to unlock
          </p>
          <h3 className="text-base font-bold text-foreground mb-1">
            {gating.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {gating.shortHint ?? gating.description}
          </p>
        </div>
      ) : null}

      <Link
        href="/portal/quests"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-deep hover:bg-primary/90 transition-colors"
      >
        Open Quest Map
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
