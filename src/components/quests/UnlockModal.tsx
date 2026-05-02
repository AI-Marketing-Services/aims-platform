"use client"

import { useEffect, useState } from "react"
import { useQuests } from "./QuestContext"
import { Trophy, Sparkles, X, Gift } from "lucide-react"
import Link from "next/link"

/**
 * Full-screen takeover modal for newly-completed quests.
 * Auto-claims if the quest hadn't been claimed yet.
 */
export function UnlockModal() {
  const { pendingUnlock, dismissUnlock, claim } = useQuests()
  const [claimResult, setClaimResult] = useState<{
    credits: number
    xp: number
    mysteryBoxCredits: number
    badgeAwarded: string | null
  } | null>(null)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    setClaimResult(null)
  }, [pendingUnlock?.key])

  if (!pendingUnlock) return null

  async function handleClaim() {
    if (!pendingUnlock) return
    setClaiming(true)
    const result = await claim(pendingUnlock.key)
    setClaiming(false)
    if (result.ok && result.reward) {
      setClaimResult(result.reward)
    } else if (result.alreadyClaimed) {
      // already claimed — just close
      dismissUnlock()
    }
  }

  const isClaimed = pendingUnlock.status === "CLAIMED" || claimResult !== null
  const featureLink = pendingUnlock.unlocksFeatureKey
    ? FEATURE_LINKS[pendingUnlock.unlocksFeatureKey]
    : null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/70 animate-in fade-in duration-300"
      onClick={dismissUnlock}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-primary/40 bg-card p-8 shadow-2xl animate-in zoom-in-90 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismissUnlock}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Animated trophy ring */}
        <div className="flex justify-center mb-6">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary/30" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-deep" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-primary text-center font-bold mb-2">
          Quest Complete
        </p>
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          {pendingUnlock.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          {pendingUnlock.description}
        </p>

        {/* Reward card */}
        <div className="rounded-xl border border-border bg-deep/40 p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              XP earned
            </span>
            <span className="text-lg font-bold text-foreground">
              +{pendingUnlock.xpReward}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Credits
            </span>
            <span className="text-lg font-bold text-primary flex items-center gap-1">
              <Sparkles className="h-4 w-4" />+{pendingUnlock.creditReward}
              {claimResult?.mysteryBoxCredits
                ? ` +${claimResult.mysteryBoxCredits}`
                : ""}
            </span>
          </div>
          {claimResult?.mysteryBoxCredits ? (
            <div className="flex items-center gap-2 text-xs text-primary pt-1 border-t border-border/50">
              <Gift className="h-3.5 w-3.5" />
              <span>
                Mystery box! +{claimResult.mysteryBoxCredits} bonus credits
              </span>
            </div>
          ) : null}
          {pendingUnlock.badgeKey ? (
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Badge
              </span>
              <span className="text-xs font-bold text-foreground">
                {pendingUnlock.badgeKey.replace(/_/g, " ")}
              </span>
            </div>
          ) : null}
        </div>

        {/* Feature unlock callout */}
        {pendingUnlock.unlocksFeatureKey ? (
          <div className="mb-4 rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wider text-primary font-bold mb-1">
              New feature unlocked
            </p>
            <p className="text-sm font-semibold text-foreground">
              {FEATURE_NAMES[pendingUnlock.unlocksFeatureKey] ??
                pendingUnlock.unlocksFeatureKey}
            </p>
          </div>
        ) : null}

        {/* CTA */}
        <div className="flex gap-2">
          {!isClaimed ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-deep hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {claiming ? "Claiming..." : "Claim Reward"}
            </button>
          ) : featureLink ? (
            <Link
              href={featureLink}
              onClick={dismissUnlock}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-deep hover:bg-primary/90 transition-colors text-center"
            >
              Try it now
            </Link>
          ) : (
            <button
              onClick={dismissUnlock}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-deep hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const FEATURE_LINKS: Record<string, string> = {
  community: "/portal/onboard",
  playbooks: "/portal/playbooks",
  ai_tools: "/portal/tools",
  crm: "/portal/crm",
  audits: "/portal/audits",
  scripts: "/portal/scripts",
  cohort_replays: "/portal/playbooks",
  proposals: "/portal/crm",
  revenue: "/portal/revenue",
  marketplace: "/portal/marketplace",
  lead_scout: "/portal/crm/scout",
  follow_up_rules: "/portal/follow-up-rules",
  signal: "/portal/signal",
  reseller: "/portal/settings",
  content: "/portal/content",
  calculator: "/portal/calculator",
  referrals: "/portal/referrals",
  tools_hub: "/portal/tools",
}

const FEATURE_NAMES: Record<string, string> = {
  community: "Community Feed",
  playbooks: "Playbooks Library",
  ai_tools: "AI Tools",
  crm: "Client CRM",
  audits: "Audit Library",
  scripts: "Scripts Hub",
  cohort_replays: "Cohort Replays",
  proposals: "Proposal Generator",
  revenue: "Revenue Dashboard",
  marketplace: "Full Marketplace",
  lead_scout: "Lead Scout",
  follow_up_rules: "Follow-Up Automation",
  signal: "Signal Engine",
  reseller: "White-label Reseller Mode",
  content: "Content Engine",
  calculator: "Pricing Calculator",
  referrals: "Referrals Dashboard",
  tools_hub: "Toolkit Hub",
}
