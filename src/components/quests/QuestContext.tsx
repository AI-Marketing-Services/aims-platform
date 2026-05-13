"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { UserProgress, QuestRow } from "@/lib/quests"
import type { FeatureKey, TriggerEvent } from "@/lib/quests/registry"

type FeatureMap = Record<FeatureKey, boolean>

interface QuestState {
  loading: boolean
  progress: UserProgress | null
  featureFlags: FeatureMap | null
  /** Quests we've already shown the unlock modal for in this session. */
  shownUnlocks: Set<string>
  /** Currently-displayed unlock modal (or null). */
  pendingUnlock: QuestRow | null
}

interface QuestContextValue extends QuestState {
  refresh: () => Promise<void>
  claim: (questKey: string) => Promise<{
    ok: boolean
    reward?: {
      credits: number
      xp: number
      mysteryBoxCredits: number
      badgeAwarded: string | null
    }
    alreadyClaimed?: boolean
  }>
  fireEvent: (event: TriggerEvent, metadata?: Record<string, unknown>) => Promise<void>
  dismissUnlock: () => void
  isFeatureUnlocked: (feature: FeatureKey) => boolean
}

const QuestContext = createContext<QuestContextValue | null>(null)

export function QuestProvider({
  children,
  suppressCelebrations = false,
}: {
  children: ReactNode
  /**
   * When true, completion modals are suppressed entirely. Quest progress
   * still loads (so feature gates still resolve) and HIDDEN quests still
   * auto-claim, but the full-screen UnlockModal never opens. Used when an
   * admin previews-as-client so they can demo without celebration popups
   * during walkthrough videos.
   */
  suppressCelebrations?: boolean
}) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [featureFlags, setFeatureFlags] = useState<FeatureMap | null>(null)
  const [loading, setLoading] = useState(true)
  const shownRef = useRef<Set<string>>(new Set())
  const [pendingUnlock, setPendingUnlock] = useState<QuestRow | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/quests", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const newProgress = data.progress as UserProgress
      const previousCompleted = new Set(
        progress?.byCategory.main
          .concat(progress?.byCategory.side ?? [])
          .filter((q) => q.status === "COMPLETED" || q.status === "CLAIMED")
          .map((q) => q.key) ?? [],
      )
      setProgress(newProgress)
      setFeatureFlags(data.featureFlags ?? null)

      // Detect newly-completed quests we haven't celebrated yet.
      const allRows = [
        ...newProgress.byCategory.main,
        ...newProgress.byCategory.side,
        ...newProgress.byCategory.hidden,
      ]
      const newlyCompleted = allRows.find(
        (q) =>
          (q.status === "COMPLETED" || q.status === "CLAIMED") &&
          !previousCompleted.has(q.key) &&
          !shownRef.current.has(q.key),
      )
      if (newlyCompleted && progress !== null) {
        // Only fire celebration on subsequent refreshes, not first load
        // (first load = grandfathered/backfilled rows shouldn't celebrate).
        shownRef.current.add(newlyCompleted.key)
        // HIDDEN quests (Night Owl, Early Bird, easter-eggs) are designed
        // to surface as quiet badges in the Quests page, NOT as a
        // full-screen modal interruption. They auto-claim silently so the
        // user still gets XP + credit ledger entries without an interstitial.
        if (newlyCompleted.category === "HIDDEN") {
          if (newlyCompleted.status === "COMPLETED") {
            void fetch(`/api/portal/quests/${newlyCompleted.key}/claim`, {
              method: "POST",
            }).catch(() => {})
          }
        } else if (!suppressCelebrations) {
          setPendingUnlock(newlyCompleted)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [progress])

  // Initial load + light polling so completions show up without manual refresh.
  useEffect(() => {
    void refresh()
    const interval = setInterval(() => {
      void refresh()
    }, 30_000) // every 30s — light, only fires when tab is open
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const claim = useCallback(
    async (questKey: string) => {
      const res = await fetch(`/api/portal/quests/${questKey}/claim`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.ok) {
        await refresh()
        // Nudge the sidebar CreditBadge to refetch immediately instead
        // of waiting for its 30s polling tick. Otherwise the operator
        // sees the celebration modal say "+15 credits" but the sidebar
        // number stays stale until they spend something.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("aoc:credits-changed"))
        }
      }
      return data
    },
    [refresh],
  )

  const fireEvent = useCallback(
    async (event: TriggerEvent, metadata?: Record<string, unknown>) => {
      try {
        await fetch("/api/portal/quests/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, metadata }),
        })
        await refresh()
      } catch {
        // best-effort
      }
    },
    [refresh],
  )

  const dismissUnlock = useCallback(() => setPendingUnlock(null), [])

  const isFeatureUnlocked = useCallback(
    (feature: FeatureKey) => featureFlags?.[feature] ?? true,
    [featureFlags],
  )

  const value = useMemo(
    () => ({
      loading,
      progress,
      featureFlags,
      shownUnlocks: shownRef.current,
      pendingUnlock,
      refresh,
      claim,
      fireEvent,
      dismissUnlock,
      isFeatureUnlocked,
    }),
    [loading, progress, featureFlags, pendingUnlock, refresh, claim, fireEvent, dismissUnlock, isFeatureUnlocked],
  )

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>
}

export function useQuests(): QuestContextValue {
  const ctx = useContext(QuestContext)
  if (!ctx) {
    // Graceful fallback so this hook is safe to call from anywhere.
    return {
      loading: true,
      progress: null,
      featureFlags: null,
      shownUnlocks: new Set(),
      pendingUnlock: null,
      refresh: async () => {},
      claim: async () => ({ ok: false }),
      fireEvent: async () => {},
      dismissUnlock: () => {},
      isFeatureUnlocked: () => true,
    }
  }
  return ctx
}
