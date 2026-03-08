"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const ROLE_PILL: Record<string, string> = {
  AI_BUILDER: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  BDR: "text-green-400 bg-green-500/10 border-green-500/20",
  PM: "text-purple-400 bg-purple-500/10 border-purple-500/20",
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

export interface InternRowTask {
  id: string
  title: string
  status: string
  dueDate: string | null
}

export interface InternRowEOD {
  id: string
  date: string
  completed: unknown
  blockers: unknown
}

export interface InternRow {
  id: string
  role: string
  status: string
  tasksCompleted: number
  revenueAttributed: number
  userName: string | null
  userEmail: string
  lastEODDate: string | null
  sprintTitle: string | null
  tasks: InternRowTask[]
  eodReports: InternRowEOD[]
}

const TASK_STATUS_COLOR: Record<string, string> = {
  TODO: "text-muted-foreground bg-muted border-border",
  IN_PROGRESS: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  IN_REVIEW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  DONE: "text-green-400 bg-green-500/10 border-green-500/20",
  BLOCKED: "text-red-400 bg-red-500/10 border-red-500/20",
}

function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-xs font-medium px-1.5 py-0.5 rounded border",
        TASK_STATUS_COLOR[status] ?? "text-muted-foreground bg-muted border-border"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function InternRosterTable({ interns }: { interns: InternRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (interns.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No intern profiles found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {["Intern", "Role", "Status", "Tasks Done", "Revenue", "Sprint", "Last EOD", ""].map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {interns.map((intern) => {
            const isExpanded = expandedId === intern.id
            const daysSinceEOD =
              intern.lastEODDate != null
                ? Math.floor((Date.now() - new Date(intern.lastEODDate).getTime()) / 86400000)
                : null

            return (
              <>
                <tr
                  key={intern.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : intern.id)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{intern.userName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{intern.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        ROLE_PILL[intern.role] ?? "text-muted-foreground bg-muted border-border"
                      )}
                    >
                      {intern.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                        STATUS_PILL[intern.status] ?? "text-muted-foreground bg-muted border-border"
                      )}
                    >
                      {intern.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-foreground">{intern.tasksCompleted}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-foreground">
                      ${intern.revenueAttributed.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {intern.sprintTitle ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {daysSinceEOD !== null ? (
                      <span
                        className={cn(
                          "text-sm",
                          daysSinceEOD > 1 ? "text-orange-400" : "text-green-400"
                        )}
                      >
                        {daysSinceEOD === 0 ? "Today" : `${daysSinceEOD}d ago`}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${intern.id}-expand`} className="bg-muted/10 border-b border-border/50">
                    <td colSpan={8} className="px-6 py-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Recent Tasks */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Recent Tasks
                          </p>
                          {intern.tasks.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No tasks assigned.</p>
                          ) : (
                            <div className="space-y-2">
                              {intern.tasks.slice(0, 6).map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                                >
                                  <p className="text-xs text-foreground truncate flex-1">{task.title}</p>
                                  <TaskStatusBadge status={task.status} />
                                </div>
                              ))}
                              {intern.tasks.length > 6 && (
                                <p className="text-xs text-muted-foreground pl-1">
                                  +{intern.tasks.length - 6} more tasks
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Recent EOD Reports */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Recent EOD Reports
                          </p>
                          {intern.eodReports.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No EOD reports submitted.</p>
                          ) : (
                            <div className="space-y-2">
                              {intern.eodReports.map((report) => {
                                const completed = Array.isArray(report.completed)
                                  ? (report.completed as string[])
                                  : []
                                const blockers = Array.isArray(report.blockers)
                                  ? (report.blockers as string[])
                                  : []
                                const dateStr = new Date(report.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                                return (
                                  <div key={report.id} className="rounded-lg bg-muted/40 px-3 py-2">
                                    <p className="text-xs text-muted-foreground mb-1">{dateStr}</p>
                                    {completed.slice(0, 2).map((item, i) => (
                                      <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                        {item}
                                      </p>
                                    ))}
                                    {blockers.length > 0 && (
                                      <p className="text-xs text-orange-400 mt-1">
                                        Blocker: {blockers[0]}
                                      </p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
