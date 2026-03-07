import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, CheckSquare, DollarSign, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Intern Ops" }

const ROLE_PILL: Record<string, string> = {
  AI_BUILDER: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  BDR: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PM: "text-green-400 bg-green-500/10 border-green-500/20",
  COORDINATOR: "text-orange-400 bg-orange-500/10 border-orange-500/20",
}

const STATUS_PILL: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-500/10 border-green-500/20",
  ONBOARDING: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  PAUSED: "text-gray-400 bg-white/5 border-border",
  COMPLETED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  APPLIED: "text-muted-foreground bg-muted border-border",
  INTERVIEW: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  REJECTED: "text-red-400 bg-red-500/10 border-red-500/20",
}

export default async function AdminInternOpsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const interns = await db.internProfile.findMany({
    include: {
      user: { select: { name: true, email: true, avatarUrl: true } },
      tasks: { where: { status: "DONE" } },
      eodReports: { orderBy: { date: "desc" }, take: 1 },
      sprintGoals: { where: { status: "active" } },
    },
    orderBy: { createdAt: "desc" },
  })

  const activeInterns = interns.filter((i) => i.status === "ACTIVE")
  const totalTasks = interns.reduce((s, i) => s + i.tasksCompleted, 0)
  const totalRevenue = interns.reduce((s, i) => s + i.revenueAttributed, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Intern Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">Track performance across the intern cohort</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Interns", value: activeInterns.length.toString(), icon: Users },
          { label: "Total Interns", value: interns.length.toString(), icon: Users },
          { label: "Tasks Completed", value: totalTasks.toLocaleString(), icon: CheckSquare },
          { label: "Revenue Attributed", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Intern table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Intern Roster</h2>
        </div>
        {interns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No intern profiles found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Intern", "Role", "Status", "Tasks Done", "Revenue", "Sprint", "Last EOD"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => {
                  const lastEOD = intern.eodReports[0]
                  const daysSinceEOD = lastEOD
                    ? Math.floor((Date.now() - new Date(lastEOD.date).getTime()) / 86400000)
                    : null

                  return (
                    <tr key={intern.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{intern.user.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{intern.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", ROLE_PILL[intern.role] ?? "text-muted-foreground bg-muted border-border")}>
                          {intern.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", STATUS_PILL[intern.status] ?? "text-muted-foreground bg-muted border-border")}>
                          {intern.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-foreground">{intern.tasksCompleted}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-foreground">${intern.revenueAttributed.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {intern.sprintGoals.length > 0 ? intern.sprintGoals[0].title : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {daysSinceEOD !== null ? (
                          <span className={cn("text-sm", daysSinceEOD > 1 ? "text-orange-400" : "text-green-400")}>
                            {daysSinceEOD === 0 ? "Today" : `${daysSinceEOD}d ago`}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
