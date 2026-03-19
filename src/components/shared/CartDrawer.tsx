"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, ShoppingCart, Trash2, ArrowRight, Loader2, Phone } from "lucide-react"
import Link from "next/link"
import { useCart } from "./CartContext"

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
}

// Context-aware upsell suggestions
const UPSELL_RULES: Array<{
  ifHas: string
  ifMissing: string
  message: string
  href: string
}> = [
  {
    ifHas: "website-crm-chatbot",
    ifMissing: "cold-outbound",
    message: "Most clients add Cold Outbound to fill their new website with leads.",
    href: "/get-started?service=cold-outbound",
  },
  {
    ifHas: "cold-outbound",
    ifMissing: "voice-agents",
    message: "Close 3x more deals by following up with AI voice calls.",
    href: "/get-started?service=voice-agents",
  },
  {
    ifHas: "seo-aeo",
    ifMissing: "ai-content-engine",
    message: "Pair SEO with the AI Content Engine for 4x more content output.",
    href: "/marketplace?service=ai-content-engine",
  },
]

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, total } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!items.length) return
    setLoading(true)
    setError(null)
    try {
      const checkoutItems = items.map((i) => ({ slug: i.slug, tierId: i.tierId }))
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems }),
      })

      let data: { url?: string; error?: string }
      try {
        data = await res.json()
      } catch {
        setError(`Server error (${res.status}) — please try again.`)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Checkout failed — please try again.")
        setLoading(false)
      }
    } catch {
      setError("Network error — please check your connection and try again.")
      setLoading(false)
    }
  }

  // Find the first matching upsell
  const slugsInCart = new Set(items.map((i) => i.slug))
  const upsell = UPSELL_RULES.find(
    (r) => slugsInCart.has(r.ifHas) && !slugsInCart.has(r.ifMissing)
  )

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={closeCart}
            />

            {/* Drawer — full screen on mobile, sidebar on desktop */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[420px] bg-card shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-foreground" />
                  <span className="text-base font-bold text-foreground">Your Cart</span>
                  {items.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {items.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeCart}
                  aria-label="Close cart"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Your cart is empty</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add services from the marketplace to get started.</p>
                  </div>
                ) : (
                  <>
                    {items.map((item) => (
                      <div key={item.serviceId} className="flex items-start gap-3 p-3.5 bg-surface rounded-xl border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
                          {item.tierName && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.tierName} plan</p>
                          )}
                          <p className="mt-1.5 text-sm font-bold text-primary">{formatPrice(item.priceMonthly)}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.serviceId)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Context-aware upsell */}
                    {upsell && (
                      <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/15">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Add-on suggestion</p>
                        <p className="text-xs text-foreground mb-2">{upsell.message}</p>
                        <Link
                          href={upsell.href}
                          onClick={closeCart}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Phone className="w-3 h-3" /> Book a call to add it
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer — sticky at bottom */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-t border-border space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly total</span>
                    <span className="text-lg font-bold text-foreground">{formatPrice(total)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Billed monthly. Cancel anytime. Final scoping confirmed on your onboarding call.
                  </p>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-xs text-destructive font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors active:scale-95"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <>Checkout with Stripe <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <Link
                    href="/get-started"
                    onClick={closeCart}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Need custom pricing? Book a strategy call →
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
