"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock, ArrowRight, Eye, Sparkles, Check } from "lucide-react"

interface Props {
  /** Stable feature key — used as the dismiss-state key in sessionStorage. */
  featureKey: string
  featureName: string
  blurb?: string
  /** Plan that unlocks this feature ("Pro" or "Operator"). */
  planName: string
  /** Plan slug — passed to checkout to start a subscription. */
  planSlug: string
  /** Monthly USD price. */
  planPriceMonthly: number
  /** Vimeo / Loom / YouTube / Screen Studio embed URL. Optional. */
  videoUrl?: string | null
  /** Bullet points shown on the paywall card. */
  highlights?: string[]
  children: React.ReactNode
}

/**
 * Renders {children} blurred behind a centered paywall card. The card
 * shows the explainer video (if set), the price, and a primary CTA that
 * starts a Stripe Checkout session for the unlocking plan.
 *
 * Dismiss is sessionStorage-scoped — the user can preview the page once
 * to evaluate, but the lock comes back on the next browser session. Server
 * routes still enforce 402 on actual data mutations.
 */
export function PaywallOverlay({
  featureKey,
  featureName,
  blurb,
  planName,
  planSlug,
  planPriceMonthly,
  videoUrl,
  highlights,
  children,
}: Props) {
  const storageKey = `aims:paywall-dismissed:${featureKey}`
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleCheckout = async () => {
    setCheckingOut(true)
    setError(null)
    try {
      const res = await fetch(`/api/checkout/${planSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "monthly" }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Checkout failed (${res.status})`)
      }
      const { url } = await res.json()
      if (!url) throw new Error("No checkout URL returned")
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setCheckingOut(false)
    }
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred preview of what's behind the paywall. */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none filter blur-md opacity-50 saturate-50"
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Paywall card */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-8 sm:pt-14 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Video — shows placeholder if no URL set yet. */}
          <div className="aspect-video bg-deep border-b border-border relative">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title={`${featureName} walkthrough`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {featureName} walkthrough
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Video coming soon — read the highlights below.
                </p>
              </div>
            )}
          </div>

          <div className="p-7 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary mb-3 text-[11px] font-bold uppercase tracking-wider">
              <Lock className="h-3 w-3" />
              {planName} plan
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {featureName}
            </h2>
            {blurb ? (
              <p className="text-sm text-muted-foreground mb-5">{blurb}</p>
            ) : null}

            {highlights && highlights.length > 0 ? (
              <ul className="text-left max-w-xs mx-auto mb-6 space-y-2">
                {highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mb-5">
              <p className="text-3xl font-bold text-foreground">
                ${planPriceMonthly}
                <span className="text-sm font-medium text-muted-foreground">
                  {" "}
                  /month
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cancel anytime · Includes monthly credit grant
              </p>
            </div>

            {error ? (
              <p className="text-xs text-destructive mb-3">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkingOut ? "Starting checkout…" : `Upgrade to ${planName}`}
              {!checkingOut && <ArrowRight className="h-4 w-4" />}
            </button>

            <Link
              href="/portal/marketplace"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors mb-2"
            >
              Compare all plans
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-1.5 text-[11px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <Eye className="h-3 w-3" />
              Continue anyway (preview only)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
