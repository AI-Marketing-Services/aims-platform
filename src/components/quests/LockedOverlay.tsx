"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock, ArrowRight, Eye } from "lucide-react"

interface Props {
  /** Stable feature key — used as the dismiss-state key in sessionStorage */
  featureKey: string
  featureName: string
  blurb?: string
  gatingTitle?: string | null
  gatingHint?: string | null
  children: React.ReactNode
}

/**
 * Renders {children} blurred behind a centered "🔒 Locked" card with a
 * prominent CTA to /portal/quests.
 *
 * The user can dismiss the overlay (per session) so they can complete the
 * unlocking action when it lives on the gated page itself (e.g. "save your
 * first script" must happen on /portal/scripts). Dismiss state is scoped to
 * sessionStorage so a fresh tab re-shows the lock — keeps the gating signal
 * loud without trapping the user.
 *
 * Server-side, the gating is informational/UX only: the unlocking events
 * (`scripts.first_saved`, `audit.first_completed`, …) fire from API routes
 * regardless of whether the overlay was dismissed.
 */
export function LockedOverlay({
  featureKey,
  featureName,
  blurb,
  gatingTitle,
  gatingHint,
  children,
}: Props) {
  const storageKey = `aims:lock-dismissed:${featureKey}`
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(storageKey) === "1") {
          setDismissed(true)
        }
      } catch {
        // sessionStorage may be blocked — fall back to overlay always shown.
      }
    }
  }, [storageKey])

  if (hydrated && dismissed) {
    return <>{children}</>
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(storageKey, "1")
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred preview of what's behind the gate. aria-hidden so screen
          readers don't read out content the user can't actually use yet. */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none filter blur-md opacity-60 saturate-50"
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Lock card overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 sm:pt-20 px-4">
        <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-7 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
            Locked feature
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {featureName}
          </h2>
          {blurb ? (
            <p className="text-sm text-muted-foreground mb-5">{blurb}</p>
          ) : null}

          {gatingTitle ? (
            <div className="rounded-xl border border-border bg-deep/50 p-4 text-left mb-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                Complete this quest to unlock
              </p>
              <p className="text-sm font-bold text-foreground mb-1">
                {gatingTitle}
              </p>
              {gatingHint ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {gatingHint}
                </p>
              ) : null}
            </div>
          ) : null}

          <Link
            href="/portal/quests"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors mb-2"
          >
            Open Quest Map
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Continue anyway (preview only)
          </button>
        </div>
      </div>
    </div>
  )
}
