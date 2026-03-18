import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  Users,
  Check,
  CheckSquare,
  DollarSign,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { InternRosterTable, type InternRow } from "@/components/admin/InternRosterTable"
import { InternInviteDialog } from "@/components/admin/InternInviteDialog"

export const metadata = { title: "Intern Ops" }

export default async function AdminInternOpsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const [interns, recentReports, taskCounts] = await Promise.all([
    db.internProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, status: true, dueDate: true },
        },
        eodReports: {
          orderBy: { date: "desc" },
          take: 3,
          select: { id: true, date: true, completed: true, blockers: true },
        },
        sprintGoals: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.eODReport.findMany({
      orderBy: { date: "desc" },
      take: 20,
      include: {
        intern: { include: { user: { select: { name: true } } } },
      },
    }),
    // Task counts by status
    db.internTask.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ])

  const activeInterns = interns.filter((i) => i.status === "ACTIVE")
  const totalTasks = interns.reduce((s, i) => s + i.tasksCompleted, 0)
  const totalRevenue = interns.reduce((s, i) => s + i.revenueAttributed, 0)

  // Check which active interns haven't submitted EOD today
  const internsWithoutEODToday = activeInterns.filter((intern) => {
    const lastEOD = intern.eodReports[0]
    if (!lastEOD) return true
    return new Date(lastEOD.date).getTime() < startOfToday.getTime()
  })

  // Task counts map
  const taskCountMap: Record<string, number> = {}
  for (const t of taskCounts) {
    taskCountMap[t.status] = t._count.id
  }

  const TASK_STATUS_DISPLAY = [
    { key: "TODO", label: "To Do", color: "text-muted-foreground" },
    { key: "IN_PROGRESS", label: "In Progress", color: "text-yellow-400" },
    { key: "IN_REVIEW", label: "In Review", color: "text-blue-400" },
    { key: "DONE", label: "Done", color: "text-green-400" },
    { key: "BLOCKED", label: "Blocked", color: "text-red-400" },
  ]

  // Serialize for client components
  const internRows: InternRow[] = interns.map((intern) => ({
    id: intern.id,
    role: intern.role,
    status: intern.status,
    tasksCompleted: intern.tasksCompleted,
    revenueAttributed: intern.revenueAttributed,
    userName: intern.user.name,
    userEmail: intern.user.email,
    lastEODDate: intern.eodReports[0]?.date
      ? new Date(intern.eodReports[0].date).toISOString()
      : null,
    sprintTitle: intern.sprintGoals[0]?.title ?? null,
    tasks: intern.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    })),
    eodReports: intern.eodReports.map((r) => ({
      id: r.id,
      date: new Date(r.date).toISOString(),
      completed: r.completed,
      blockers: r.blockers,
    })),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Intern Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance across the intern cohort
          </p>
        </div>
        <InternInviteDialog />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Active Interns",
            value: activeInterns.length.toString(),
            sub: `${interns.length} total`,
            icon: Users,
          },
          {
            label: "Tasks Completed",
            value: totalTasks.toLocaleString(),
            sub: "All time",
            icon: CheckSquare,
          },
          {
            label: "Revenue Attributed",
            value: `$${totalRevenue.toLocaleString()}`,
            sub: "All time",
            icon: DollarSign,
          },
          {
            label: "EODs Missing Today",
            value: internsWithoutEODToday.length.toString(),
            sub:
              internsWithoutEODToday.length > 0
                ? "Active interns behind"
                : "All interns up to date",
            icon: FileText,
            alert: internsWithoutEODToday.length > 0,
          },
        ].map(({ label, value, sub, icon: Icon, alert }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border bg-card p-5",
              alert ? "border-orange-500/30" : "border-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  alert ? "bg-orange-500/10" : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    alert ? "text-orange-400" : "text-muted-foreground"
                  )}
                />
              </div>
            </div>
            <p
              className={cn(
                "text-xl font-bold font-mono",
                alert ? "text-orange-400" : "text-foreground"
              )}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Task overview stat row */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Task Overview</h2>
        <div className="grid grid-cols-5 gap-3">
          {TASK_STATUS_DISPLAY.map(({ key, label, color }) => (
            <div key={key} className="rounded-lg bg-muted/50 px-4 py-3 text-center">
              <p className={cn("text-2xl font-bold font-mono", color)}>
                {(taskCountMap[key] ?? 0).toString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing EOD alert */}
      {internsWithoutEODToday.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-400">Missing EOD Reports</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {internsWithoutEODToday.map((i) => i.user.name ?? i.user.email).join(", ")}{" "}
              {internsWithoutEODToday.length === 1 ? "has" : "have"} not submitted an EOD report
              today.
            </p>
          </div>
        </div>
      )}

      {/* Intern Roster table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Intern Roster</h2>
          <span className="ml-auto text-xs text-muted-foreground">{interns.length} interns</span>
        </div>
        <InternRosterTable interns={internRows} />
      </div>

      {/* EOD Report feed */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent EOD Reports</h2>
          <span className="ml-auto text-xs text-muted-foreground">{recentReports.length} reports</span>
        </div>
        {recentReports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No EOD reports submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentReports.map((report) => {
              const completed = Array.isArray(report.completed)
                ? (report.completed as string[])
                : []
              const blockers = Array.isArray(report.blockers)
                ? (report.blockers as string[])
                : []
              return (
                <div key={report.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {report.intern.user.name ?? "Intern"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-0.5 mb-1">
                    {completed.slice(0, 3).map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                    {completed.length > 3 && (
                      <li className="text-xs text-muted-foreground pl-5">
                        +{completed.length - 3} more
                      </li>
                    )}
                  </ul>
                  {blockers.length > 0 && (
                    <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
                      <p className="text-xs text-red-400 font-medium">
                        Blocker: {blockers[0]}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
