"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Trophy,
  Sparkles,
  Lock,
  CheckCircle2,
  Gift,
  Flame,
  Map,
  Eye,
  EyeOff,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useQuests } from "@/components/quests/QuestContext"
import type { UserProgress, QuestRow } from "@/lib/quests"
import { cn } from "@/lib/utils"

const TIER_NAMES: Record<number, string> = {
  0: "Day Zero",
  1: "Foundation",
  2: "Activation",
  3: "Revenue",
  4: "Mastery",
}

const TIER_TAGLINES: Record<number, string> = {
  0: "Welcome to the Collective. Three free wins to get oriented.",
  1: "Get the basics in place. Profile, intro, lane.",
  2: "Activate your first prospect. Real revenue starts here.",
  3: "Get a dollar in motion. Proposals, invoices, marketplace.",
  4: "Turn one-time wins into a system. Automate and refer.",
}

interface Props {
  initialProgress: UserProgress
}

export function QuestsClient({ initialProgress }: Props) {
  const ctx = useQuests()
  const [tab, setTab] = useState<"main" | "side" | "achievements">("main")
  const [showCompleted, setShowCompleted] = useState(true)

  // Use ctx.progress when available (auto-refresh), fall back to initial.
  const progress = ctx.progress ?? initialProgress

  // On mount, fire a refresh so the client picks up any newly-completed
  // quests since the SSR snapshot.
  useEffect(() => {
    void ctx.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <header className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" /> Operator Journey
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {TIER_NAMES[progress.questLevel] ?? "Master Operator"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              {TIER_TAGLINES[progress.questLevel] ??
                "You've finished the main quest line. Keep your streak alive."}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Stat
              label="XP"
              value={progress.totalXp.toLocaleString()}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            />
            <Stat
              label="Quests done"
              value={`${progress.completedCount}/${progress.totalMainCount}`}
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            />
            {progress.streak ? (
              <Stat
                label="Streak"
                value={`${progress.streak.current}d`}
                icon={<Flame className="h-3.5 w-3.5" />}
                accent
              />
            ) : null}
          </div>
        </div>

        {/* Tier progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Progress to next unlock</span>
            <span className="font-bold text-foreground">
              {progress.pctToNextUnlock}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
              style={{ width: `${progress.pctToNextUnlock}%` }}
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          <TabButton active={tab === "main"} onClick={() => setTab("main")}>
            <Map className="h-4 w-4" /> Main Quest
          </TabButton>
          <TabButton active={tab === "side"} onClick={() => setTab("side")}>
            <Sparkles className="h-4 w-4" /> Sidequests
          </TabButton>
          <TabButton
            active={tab === "achievements"}
            onClick={() => setTab("achievements")}
          >
            <Gift className="h-4 w-4" /> Achievements
          </TabButton>
        </div>
        <button
          onClick={() => setShowCompleted((s) => !s)}
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCompleted ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Hide completed
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Show completed
            </>
          )}
        </button>
      </div>

      {tab === "main" ? (
        <MainQuestList quests={progress.byCategory.main} showCompleted={showCompleted} />
      ) : null}
      {tab === "side" ? (
        <SideQuestList quests={progress.byCategory.side} showCompleted={showCompleted} />
      ) : null}
      {tab === "achievements" ? (
        <AchievementList progress={progress} />
      ) : null}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
        active
          ? "text-foreground border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 justify-end mb-0.5">
        {icon} {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold leading-none",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MainQuestList({
  quests,
  showCompleted,
}: {
  quests: QuestRow[]
  showCompleted: boolean
}) {
  // Group by tier.
  const tiers: Record<number, QuestRow[]> = {}
  for (const q of quests) {
    const t = q.tier ?? 0
    if (!tiers[t]) tiers[t] = []
    tiers[t].push(q)
  }

  return (
    <div className="space-y-10">
      {Object.entries(tiers).map(([tierStr, tierQuests]) => {
        const tier = Number(tierStr)
        const visible = showCompleted
          ? tierQuests
          : tierQuests.filter(
              (q) => q.status !== "COMPLETED" && q.status !== "CLAIMED",
            )
        if (visible.length === 0) return null
        const tierDone = tierQuests.filter(
          (q) => q.status === "COMPLETED" || q.status === "CLAIMED",
        ).length
        return (
          <section key={tier}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-1">
                  Tier {tier}
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  {TIER_NAMES[tier] ?? `Tier ${tier}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {TIER_TAGLINES[tier]}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {tierDone} / {tierQuests.length} complete
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((q) => (
                <QuestCard key={q.key} quest={q} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SideQuestList({
  quests,
  showCompleted,
}: {
  quests: QuestRow[]
  showCompleted: boolean
}) {
  const visible = showCompleted
    ? quests
    : quests.filter(
        (q) => q.status !== "COMPLETED" && q.status !== "CLAIMED",
      )

  return (
    <section>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Optional missions. Complete them for credits, badges, and the
        occasional mystery box. Sidequests don't gate features — they just
        keep things interesting.
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((q) => (
          <QuestCard key={q.key} quest={q} compact />
        ))}
      </div>
    </section>
  )
}

function AchievementList({ progress }: { progress: UserProgress }) {
  const earned = progress.badges
  const hiddenCompleted = progress.byCategory.hidden

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Badges earned</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Quietly stack these. Every badge is a moment you proved something.
        </p>
        {earned.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No badges yet. Complete a quest to earn your first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {earned.map((b) => (
              <div
                key={b.key}
                className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center"
              >
                <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground capitalize">
                  {b.key.replace(/_/g, " ")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(b.earnedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {hiddenCompleted.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Hidden discoveries
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Quietly tracked. You've found these without being told.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {hiddenCompleted.map((q) => (
              <QuestCard key={q.key} quest={q} compact />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function QuestCard({ quest, compact = false }: { quest: QuestRow; compact?: boolean }) {
  const ctx = useQuests()
  const [claiming, setClaiming] = useState(false)

  const isLocked = quest.status === "LOCKED"
  const isCompleted = quest.status === "COMPLETED"
  const isClaimed = quest.status === "CLAIMED"
  const inProgress = quest.status === "IN_PROGRESS"

  const Icon = useMemo(() => {
    if (!quest.iconName) return Trophy
    const fromLib = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
      quest.iconName
    ]
    return fromLib ?? Trophy
  }, [quest.iconName])

  const pct = quest.goal > 1 ? Math.round((quest.progress / quest.goal) * 100) : 0

  async function handleClaim() {
    setClaiming(true)
    await ctx.claim(quest.key)
    setClaiming(false)
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-150 flex gap-3",
        isClaimed
          ? "border-border bg-card/50 opacity-70"
          : isCompleted
            ? "border-primary/50 bg-primary/5"
            : isLocked
              ? "border-dashed border-border bg-card/30"
              : "border-border bg-card hover:border-primary/30",
      )}
    >
      <div
        className={cn(
          "shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg",
          isLocked
            ? "bg-surface text-muted-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className={cn(
              "text-sm font-bold truncate",
              isLocked ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {quest.title}
          </h3>
          {isCompleted && !isClaimed ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Ready
            </span>
          ) : isClaimed ? (
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          ) : null}
        </div>

        <p
          className={cn(
            "text-xs leading-relaxed mb-3",
            isLocked ? "text-muted-foreground/70" : "text-muted-foreground",
          )}
        >
          {compact ? (quest.shortHint ?? quest.description) : quest.description}
        </p>

        {quest.goal > 1 ? (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{quest.progress} / {quest.goal}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : null}

        {isLocked && quest.prerequisiteTitles?.length ? (
          <p className="text-[10px] text-muted-foreground mb-2">
            Finish: {quest.prerequisiteTitles.join(", ")}
          </p>
        ) : null}

        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-muted-foreground">
            <Sparkles className="h-3 w-3 inline -mt-0.5 mr-0.5" />
            {quest.xpReward} XP · {quest.creditReward} credits
          </span>
          {quest.hasMysteryBox ? (
            <span className="text-primary font-bold flex items-center gap-1">
              <Gift className="h-3 w-3" /> Mystery Box
            </span>
          ) : null}
        </div>

        {isCompleted && !isClaimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-deep hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {claiming ? "Claiming..." : "Claim Reward"}
          </button>
        ) : null}

        {inProgress && quest.shortHint ? (
          <p className="text-[10px] text-primary mt-2">{quest.shortHint}</p>
        ) : null}
      </div>
    </div>
  )
}
