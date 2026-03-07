import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CheckSquare, Target, FileText, TrendingUp, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = { title: "Dashboard" }

export default async function InternDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const profile = await db.internProfile.findUnique({
    where: { userId: dbUser.id },
    include: {
      tasks: {
        where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] } },
        orderBy: { priority: "desc" },
        take: 5,
      },
      sprintGoals: { where: { status: "active" }, take: 1 },
      eodReports: { orderBy: { date: "desc" }, take: 1 },
    },
  })

  const firstName = dbUser.name?.split(" ")[0] ?? "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const hasEODToday = profile?.eodReports[0]
    ? new Date(profile.eodReports[0].date).toDateString() === new Date().toDateString()
    : false

  const PRIORITY_COLOR: Record<string, string> = {
    URGENT: "text-red-400",
    HIGH: "text-orange-400",
    MEDIUM: "text-yellow-400",
    LOW: "text-muted-foreground",
  }

  const STATUS_ICON = {
    TODO: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    IN_PROGRESS: <TrendingUp className="h-3.5 w-3.5 text-blue-400" />,
    BLOCKED: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
    IN_REVIEW: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
    DONE: <CheckSquare className="h-3.5 w-3.5 text-green-400" />,
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* EOD reminder */}
      {!hasEODToday && (
        <div className="rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-[#DC2626]" />
            <p className="text-sm font-medium text-foreground">EOD report not submitted today</p>
          </div>
          <Link
            href="/intern/eod-report"
            className="text-sm font-medium text-[#DC2626] hover:underline"
          >
            Submit now
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tasks Completed", value: profile?.tasksCompleted ?? 0, icon: CheckSquare },
          { label: "Revenue Attributed", value: `$${(profile?.revenueAttributed ?? 0).toLocaleString()}`, icon: TrendingUp },
          { label: "Active Sprint", value: profile?.sprintGoals[0]?.title ?? "None", icon: Target, isText: true },
          { label: "EOD Reports", value: profile?.eodReports?.length?.toString() ?? "0", icon: FileText },
        ].map(({ label, value, icon: Icon, isText }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className={cn("font-bold text-foreground", isText ? "text-sm leading-tight" : "text-xl font-mono")}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* My tasks */}
      {profile && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Open Tasks</h2>
            <Link href="/intern/tasks" className="text-xs text-[#DC2626] hover:underline">View all</Link>
          </div>
          {profile.tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {profile.tasks.map((task) => (
                <div key={task.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {STATUS_ICON[task.status] ?? STATUS_ICON.TODO}
                    <p className="text-sm text-foreground truncate">{task.title}</p>
                  </div>
                  <span className={cn("text-xs font-medium flex-shrink-0", PRIORITY_COLOR[task.priority])}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No profile state */}
      {!profile && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Profile not set up</p>
          <p className="text-xs text-muted-foreground mt-1">Your intern profile will be created by your team lead.</p>
        </div>
      )}
    </div>
  )
}
