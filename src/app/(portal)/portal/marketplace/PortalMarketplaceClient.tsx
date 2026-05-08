"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  CreditCard,
  Briefcase,
  MapPin,
  ClipboardCheck,
  FileText,
  FileCode2,
  PenLine,
  BookOpen,
  Calculator,
  Globe,
  Bell,
  TrendingUp,
  Users,
  Lock,
  type LucideIcon,
} from "lucide-react"

interface PlanCard {
  slug: string
  name: string
  tagline: string
  description: string
  priceMonthly: number
  creditsPerMonth: number
  highlights: string[]
  badge: string | null
  sortOrder: number
  marketingVideoUrl: string | null
  isCheckoutReady: boolean
}

interface CreditPackCard {
  slug: string
  name: string
  credits: number
  price: number
  badge: string | null
  sortOrder: number
  isCheckoutReady: boolean
}

interface FeatureCard {
  key: string
  name: string
  iconName: string
  tagline: string
  description: string
  highlights: string[]
  href: string
  sortOrder: number
  includedOnPlans: string[]
  cheapestPlanName: string | null
  cheapestPlanPriceMonthly: number | null
}

// Mapped here (instead of dynamic import) so tree-shaking still works
// and we don't bundle every lucide icon.
const FEATURE_ICONS: Record<string, LucideIcon> = {
  Briefcase,
  MapPin,
  ClipboardCheck,
  FileText,
  FileCode2,
  PenLine,
  BookOpen,
  Calculator,
  Sparkles,
  Globe,
  Bell,
  TrendingUp,
  Users,
}

interface Props {
  currentPlanSlug: string
  plans: PlanCard[]
  creditPacks: CreditPackCard[]
  features: FeatureCard[]
}

export function PortalMarketplaceClient({
  currentPlanSlug,
  plans,
  creditPacks,
  features,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (
    slug: string,
    interval: "monthly" | "one_time",
  ) => {
    setBusy(slug)
    setError(null)
    try {
      const res = await fetch(`/api/checkout/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.error ?? `Checkout failed (${res.status})`)
      if (!data.url) throw new Error("No checkout URL returned")
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setBusy(null)
    }
  }

  return (
    <div className="space-y-10">
      {/* Plans rail */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Plans</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pick the plan that matches your stage. Upgrade or downgrade anytime.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentPlanSlug === plan.slug
            const isFree = plan.priceMonthly === 0
            const isFeatured = plan.badge === "Most popular"

            return (
              <div
                key={plan.slug}
                className={`relative rounded-2xl border bg-card p-6 flex flex-col ${
                  isFeatured
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.badge ? (
                  <span className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                    {plan.badge}
                  </span>
                ) : null}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
                </div>

                {/* Video — placeholder if URL not set yet. */}
                <div className="aspect-video rounded-lg overflow-hidden bg-deep border border-border mb-5 relative">
                  {plan.marketingVideoUrl ? (
                    <iframe
                      src={plan.marketingVideoUrl}
                      title={`${plan.name} walkthrough`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                      <Sparkles className="h-5 w-5 text-primary/60 mb-2" />
                      <p className="text-[11px] text-muted-foreground">
                        Walkthrough video coming soon
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <p className="text-3xl font-bold text-foreground">
                    {isFree ? "Free" : `$${plan.priceMonthly}`}
                    {!isFree && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {" "}
                        /mo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.creditsPerMonth.toLocaleString()} credits per month
                  </p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Current plan
                    </span>
                  </div>
                ) : isFree ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
                  >
                    Default for new accounts
                  </button>
                ) : !plan.isCheckoutReady ? (
                  // Stripe price isn't seeded for this plan yet. Render
                  // a disabled "Contact us" button + a mailto fallback
                  // so a willing buyer doesn't bounce — they can still
                  // start the conversation while ops finishes the
                  // Stripe Product setup. Previously the button copy
                  // said "Coming soon" with a dev-only tooltip about
                  // running scripts/setup-plans.ts, which left James
                  // staring at an unreachable upgrade button.
                  <a
                    href={`mailto:hello@aioperatorcollective.com?subject=Upgrade%20to%20${encodeURIComponent(plan.name)}&body=I%27d%20like%20to%20upgrade%20to%20the%20${encodeURIComponent(plan.name)}%20plan%20but%20checkout%20isn%27t%20live%20yet.`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-card px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    title="Stripe checkout for this plan isn't enabled yet — email us to upgrade today"
                  >
                    Contact to upgrade
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.slug, "monthly")}
                    disabled={busy === plan.slug}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      isFeatured
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-primary text-primary hover:bg-primary/5"
                    }`}
                  >
                    {busy === plan.slug
                      ? "Starting checkout…"
                      : `Upgrade to ${plan.name}`}
                    {busy !== plan.slug && <ArrowRight className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Credit packs rail */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Credit packs
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-time top-ups for when you need more enrichment runs than your plan
              includes. Credits never expire.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {creditPacks.map((pack) => (
            <div
              key={pack.slug}
              className="relative rounded-2xl border border-border bg-card p-5 flex flex-col"
            >
              {pack.badge ? (
                <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  {pack.badge}
                </span>
              ) : null}

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{pack.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {pack.credits.toLocaleString()} enrichment credits
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold text-foreground mb-4">
                ${pack.price}
                <span className="text-xs font-medium text-muted-foreground">
                  {" "}
                  one-time
                </span>
              </p>

              {!pack.isCheckoutReady ? (
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
                >
                  Coming soon
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout(pack.slug, "one_time")}
                  disabled={busy === pack.slug}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary text-primary hover:bg-primary/5 px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy === pack.slug ? "Starting checkout…" : "Buy credits"}
                  {busy !== pack.slug && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features grid — every gated feature with full marketing copy.
          Helps users understand exactly what they unlock with each plan
          before they buy. Each card deep-links to the feature for users
          who already have the entitlement. */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Everything in the platform
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each feature below is unlocked through the plan it&apos;s
              included on. Hover any card to see what you get.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = FEATURE_ICONS[feature.iconName] ?? Sparkles
            const isOnCurrentPlan = feature.includedOnPlans.some(
              (planName) => planName.toLowerCase() === currentPlanSlug,
            )
            return (
              <div
                key={feature.key}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {feature.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {feature.tagline}
                      </p>
                    </div>
                  </div>
                  {isOnCurrentPlan ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  {feature.description}
                </p>

                <ul className="space-y-1.5 mb-4 flex-1">
                  {feature.highlights.slice(0, 3).map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-[11px] text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                  <div className="text-[11px] text-muted-foreground">
                    {feature.cheapestPlanName ? (
                      <>
                        Included on{" "}
                        <span className="font-bold text-foreground">
                          {feature.cheapestPlanName}
                        </span>
                        {feature.cheapestPlanPriceMonthly ? (
                          <>
                            {" "}
                            (${feature.cheapestPlanPriceMonthly}/mo)
                          </>
                        ) : null}
                      </>
                    ) : (
                      "Unavailable"
                    )}
                  </div>
                  {isOnCurrentPlan ? (
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
