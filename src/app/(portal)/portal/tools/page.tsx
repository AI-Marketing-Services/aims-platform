import { db } from "@/lib/db"
import { TOOL_MANIFEST, CATEGORIES, getUnlockedTools } from "@/lib/tools/manifest"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { ToolsGrid } from "@/components/portal/tools/ToolsGrid"
import { Wrench, Lock } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"

async function getPageData(userId: string) {
  const [progress, activeDeals] = await Promise.all([
    getProgressForUser(userId),
    db.clientDeal.count({ where: { userId, stage: "ACTIVE_RETAINER" } }),
  ])

  return {
    onboardingPercent: progress.percent,
    hasActiveDeal: activeDeals > 0,
  }
}

export const dynamic = "force-dynamic"

export default async function ToolsPage() {
  const dbUser = await ensureDbUser()
  const data = await getPageData(dbUser.id)

  const unlockedGates = getUnlockedTools(data.onboardingPercent, data.hasActiveDeal)
  const totalTools = TOOL_MANIFEST.length
  const unlockedCount = TOOL_MANIFEST.filter((t) => unlockedGates.has(t.gate)).length
  const lockedCount = totalTools - unlockedCount

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Operator Toolkit</h1>
            <p className="text-xs text-muted-foreground">
              Curated tools for building your AI consulting business
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unlocked</p>
            <p className="text-sm font-bold text-foreground">{unlockedCount}</p>
          </div>
          {lockedCount > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Locked</p>
              <p className="text-sm font-bold text-muted-foreground flex items-center gap-1 justify-end">
                <Lock className="h-3 w-3" />
                {lockedCount}
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</p>
            <p className="text-sm font-bold text-foreground">{data.onboardingPercent}%</p>
          </div>
        </div>
      </div>

      {/* Unlock progress bar (if not 100%) */}
      {data.onboardingPercent < 100 && (
        <div className="px-6 py-3 bg-surface/40 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground">
              Complete your onboarding to unlock more tools
            </p>
            <a
              href="/portal/onboard"
              className="text-xs text-primary hover:underline font-medium"
            >
              Continue →
            </a>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${data.onboardingPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tools grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <ToolsGrid
          tools={TOOL_MANIFEST}
          categories={CATEGORIES}
          unlockedGates={Array.from(unlockedGates)}
        />
      </div>
    </div>
  )
}
