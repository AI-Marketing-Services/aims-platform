"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Sidebar credit-balance badge.
 *
 * Why client-side: the sidebar is rendered in an RSC layout, so the
 * credit balance is baked in at SSR time and stays stale until the
 * user navigates to a different page. After the user EARNS credits
 * (quest claim, monthly grant, refund) or SPENDS credits (enrich
 * call, AI chat) the displayed number didn't refresh — operators
 * thought their reward never landed.
 *
 * Fix: lightweight client component that
 *   1. Renders the SSR-provided initial value immediately (no flash).
 *   2. Polls /api/portal/credits/balance every 30s in the background.
 *   3. Listens for a window-level "aoc:credits-changed" event so the
 *      code that GRANTED the credits can trigger an immediate refetch
 *      without waiting for the 30s tick.
 *
 * Anything that mutates creditBalance can do:
 *   window.dispatchEvent(new Event("aoc:credits-changed"))
 *
 * and the badge updates within ~50ms instead of within 30s.
 */
export const CREDIT_BALANCE_EVENT = "aoc:credits-changed"

interface CreditBadgeProps {
  initialBalance: number
  initialPlanTier: string
}

export function CreditBadge({
  initialBalance,
  initialPlanTier,
}: CreditBadgeProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [planTier, setPlanTier] = useState(initialPlanTier)

  useEffect(() => {
    let cancelled = false

    async function refetch() {
      try {
        const res = await fetch("/api/portal/credits/balance", {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = (await res.json()) as {
          creditBalance: number
          creditPlanTier: string
        }
        if (cancelled) return
        setBalance(data.creditBalance ?? 0)
        setPlanTier(data.creditPlanTier ?? "free")
      } catch {
        // Network blip — leave the previous value visible.
      }
    }

    // Light background poll. 30s is short enough that "I just earned
    // credits" feedback feels instant on most operator workflows
    // (claim modal → close → glance at sidebar), and small enough
    // bandwidth-wise to ignore (response is ~60 bytes).
    const interval = setInterval(refetch, 30_000)

    function onEvent() {
      void refetch()
    }
    window.addEventListener(CREDIT_BALANCE_EVENT, onEvent)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener(CREDIT_BALANCE_EVENT, onEvent)
    }
  }, [])

  const lowBalance = balance < 50

  return (
    <Link
      href="/portal/billing"
      className={cn(
        "mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
        lowBalance
          ? "border border-primary/40 bg-primary/5 hover:bg-primary/10"
          : "border border-border bg-surface/40 hover:bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className={cn("h-3.5 w-3.5", lowBalance ? "text-primary" : "text-primary")}
        />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">
            Credits
          </p>
          <p
            className={cn(
              "text-sm font-bold leading-tight mt-0.5 tabular-nums",
              lowBalance ? "text-primary" : "text-foreground",
            )}
          >
            {balance.toLocaleString()}
          </p>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
        {planTier}
      </span>
    </Link>
  )
}
