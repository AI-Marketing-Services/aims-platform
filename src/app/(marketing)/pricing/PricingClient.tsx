"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"

export type ProductCard = {
  id: string
  slug: string
  name: string
  description: string | null
  type: string
  entitlements: string[]
  grantsRole: string | null
  hasMonthly: boolean
  hasAnnual: boolean
  hasOneTime: boolean
}

const ENTITLEMENT_LABELS: Record<string, string> = {
  "member-only-content": "Mighty Networks community access",
  "playbook-vault": "Operator playbook vault",
  "chatbot-premium": "AI chatbot (premium model)",
  "audit-tool": "AI audit tools",
  "voice-agent": "AI voice agent",
  "whitelabel-tools": "Whitelabel tenant page",
  "commission-tracking": "Commission dashboard",
}

type Interval = "monthly" | "annual" | "one_time"

export function PricingClient({ cards }: { cards: ProductCard[] }) {
  const tiers = cards.filter((c) => c.type === "tier")
  const tools = cards.filter((c) => c.type === "tool")
  const addons = cards.filter((c) => c.type === "addon")

  const [annual, setAnnual] = useState(false)
  const [busySlug, setBusySlug] = useState<string | null>(null)

  async function checkout(slug: string, interval: Interval) {
    setBusySlug(slug)
    try {
      const res = await fetch(`/api/checkout/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401 && body.signInUrl) {
        window.location.href = body.signInUrl
        return
      }
      if (!res.ok || !body.url) {
        toast.error(body.error ?? "Couldn't start checkout. Please try again.")
        return
      }
      window.location.href = body.url
    } catch {
      toast.error("Network error — please try again.")
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div className="space-y-16">
      {/* Annual/monthly toggle */}
      {tiers.some((t) => t.hasAnnual) && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                !annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-2 text-[10px] font-mono">2 months free</span>
            </button>
          </div>
        </div>
      )}

      {/* Tiers */}
      {tiers.length > 0 && (
        <section>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((t, i) => (
              <Card
                key={t.id}
                card={t}
                interval={annual && t.hasAnnual ? "annual" : "monthly"}
                onCheckout={checkout}
                busy={busySlug === t.slug}
                highlight={i === 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <section>
          <h2 className="text-xl font-serif text-foreground mb-1">A la carte tools</h2>
          <p className="text-sm text-foreground/60 mb-6">Add to any tier above.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {tools.map((t) => (
              <Card
                key={t.id}
                card={t}
                interval={t.hasOneTime ? "one_time" : t.hasMonthly ? "monthly" : "annual"}
                onCheckout={checkout}
                busy={busySlug === t.slug}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {addons.length > 0 && (
        <section>
          <h2 className="text-xl font-serif text-foreground mb-6">Add-ons</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {addons.map((a) => (
              <Card
                key={a.id}
                card={a}
                interval={a.hasMonthly ? "monthly" : a.hasOneTime ? "one_time" : "annual"}
                onCheckout={checkout}
                busy={busySlug === a.slug}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <div className="text-center text-xs text-foreground/50">
        Prices in USD. Cancel any subscription from your portal at any time. Refunds within 30 days.
      </div>
    </div>
  )
}

function Card({
  card,
  interval,
  onCheckout,
  busy,
  highlight = false,
  compact = false,
}: {
  card: ProductCard
  interval: Interval
  onCheckout: (slug: string, interval: Interval) => void
  busy: boolean
  highlight?: boolean
  compact?: boolean
}) {
  const canBuy =
    (interval === "monthly" && card.hasMonthly) ||
    (interval === "annual" && card.hasAnnual) ||
    (interval === "one_time" && card.hasOneTime)

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        highlight
          ? "border-primary bg-card shadow-lg shadow-primary/5 relative"
          : "border-border bg-card"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold uppercase tracking-wider">
          Most popular
        </span>
      )}

      <h3 className="text-xl font-serif text-foreground mb-1">{card.name}</h3>
      {card.description && (
        <p className="text-sm text-foreground/70 mb-4">{card.description}</p>
      )}

      {!compact && (
        <ul className="space-y-2 mb-6 text-sm flex-1">
          {card.entitlements.map((e) => (
            <li key={e} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/80">{ENTITLEMENT_LABELS[e] ?? e}</span>
            </li>
          ))}
          {card.grantsRole && (
            <li className="flex items-start gap-2 pt-2 border-t border-border">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/80 font-medium">
                Unlocks {card.grantsRole.charAt(0)}
                {card.grantsRole.slice(1).toLowerCase()} role
              </span>
            </li>
          )}
        </ul>
      )}

      {compact && (
        <div className="text-xs font-mono text-muted-foreground mb-4">
          Includes: {card.entitlements.join(", ")}
        </div>
      )}

      <button
        onClick={() => onCheckout(card.slug, interval)}
        disabled={busy || !canBuy}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
          highlight
            ? "bg-primary text-white hover:bg-primary/90"
            : "bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border"
        }`}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting checkout…
          </span>
        ) : !canBuy ? (
          "Coming soon"
        ) : (
          <>Choose {card.name}</>
        )}
      </button>
    </div>
  )
}
