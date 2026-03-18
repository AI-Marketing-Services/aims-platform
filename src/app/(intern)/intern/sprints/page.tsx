import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Target, CheckSquare, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Sprints" }

const TASK_STATUS_COLOR: Record<string, string> = {
  TODO: "text-muted-foreground",
  IN_PROGRESS: "text-blue-400",
  IN_REVIEW: "text-yellow-400",
  DONE: "text-green-400",
  BLOCKED: "text-red-400",
}

const TASK_STATUS_ICON: Record<string, React.FC<{ className?: string }>> = {
  TODO: Clock,
  IN_PROGRESS: Target,
  IN_REVIEW: Clock,
  DONE: CheckSquare,
  BLOCKED: AlertCircle,
}

export default async function InternSprintsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const profile = await db.internProfile.findUnique({
    where: { userId: dbUser.id },
    include: {
      sprintGoals: {
        orderBy: { startDate: "desc" },
        include: {
          tasks: { orderBy: [{ priority: "desc" }, { createdAt: "asc" }] },
        },
      },
    },
  })

  const goals = profile?.sprintGoals ?? []
  const activeGoal = goals.find((g) => g.status === "active")
  const pastGoals = goals.filter((g) => g.status !== "active")

  function sprintProgress(goal: typeof goals[number]) {
    const total = goal.tasks.length
    const done = goal.tasks.filter((t) => t.status === "DONE").length
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
        <p className="text-sm text-muted-foreground mt-1">Weekly sprint goals and task breakdown</p>
      </div>

      {/* Active sprint */}
      {activeGoal ? (
        <div className="rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider">Active Sprint</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">{activeGoal.title}</h2>
          <div className="text-xs text-muted-foreground mb-4">
            {new Date(activeGoal.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {new Date(activeGoal.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>

          {activeGoal.tasks.length > 0 && (() => {
            const { total, done, pct } = sprintProgress(activeGoal)
            return (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{done}/{total} tasks complete</span>
                  <span className="font-mono text-foreground">{pct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-5">
                  <div className="h-full rounded-full bg-[#DC2626] transition-all" style={{ width: `${pct}%` }} />
                </div>
              </>
            )
          })()}

          <div className="space-y-2">
            {activeGoal.tasks.map((task) => {
              const Icon = TASK_STATUS_ICON[task.status] ?? Clock
              return (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                  <Icon className={cn("h-4 w-4 flex-shrink-0", TASK_STATUS_COLOR[task.status])} />
                  <span className={cn("text-sm flex-1", task.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground")}>
                    {task.title}
                  </span>
                  {task.estimatedHours && (
                    <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>
                  )}
                </div>
              )
            })}
            {activeGoal.tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks assigned to this sprint yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No active sprint</p>
          <p className="text-xs text-muted-foreground mt-1">Your team lead will assign a sprint goal.</p>
        </div>
      )}

      {/* Past sprints */}
      {pastGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Past Sprints</h2>
          {pastGoals.map((goal) => {
            const { total, done, pct } = sprintProgress(goal)
            return (
              <div key={goal.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{goal.title}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{pct}% complete</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(goal.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                  {new Date(goal.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-muted-foreground/50 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{done}/{total} tasks done</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
