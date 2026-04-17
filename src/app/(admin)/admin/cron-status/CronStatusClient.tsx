"use client"

import { useState, useEffect } from "react"
import {
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
  Zap,
} from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

interface CronExecution {
  id: string
  status: string
  details: string | null
  duration: number
  createdAt: string
}

interface CronJobSummary {
  jobName: string
  lastRun: string | null
  lastStatus: string | null
  lastDetails: string | null
  avgDuration: number
  totalRuns: number
  successCount: number
  errorCount: number
  recentExecutions: CronExecution[]
  isOverdue: boolean
  expectedIntervalHours: number
}

const JOB_DISPLAY: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  "daily-digest": {
    label: "Daily Digest",
    description: "Sends daily performance summary to admin channels",
    icon: Activity,
  },
  "check-churn": {
    label: "Churn Check",
    description: "Identifies at-risk clients who have not logged in for 14+ days",
    icon: AlertTriangle,
  },
  "process-email-queue": {
    label: "Email Queue Processor",
    description: "Processes pending email sequence items from the queue",
    icon: Zap,
  },
}


function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function CronStatusClient() {
  const [jobs, setJobs] = useState<CronJobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/cron-status")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } catch {
      setError("Failed to load cron status")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const overdueJobs = jobs.filter((j) => j.isOverdue)

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cron Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor the health and execution history of scheduled jobs
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Overdue Alert Banner */}
      {overdueJobs.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">
                {overdueJobs.length} cron job{overdueJobs.length > 1 ? "s" : ""} overdue
              </p>
              <p className="text-xs text-primary mt-0.5">
                {overdueJobs.map((j) => {
                  const display = JOB_DISPLAY[j.jobName]
                  return display?.label ?? j.jobName
                }).join(", ")}{" "}
                {overdueJobs.length > 1 ? "have" : "has"} not run within the expected interval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && jobs.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="h-5 w-36 bg-surface rounded animate-pulse" />
              <div className="h-4 w-full bg-deep rounded animate-pulse" />
              <div className="h-32 w-full bg-deep rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Job Cards */}
      {!loading || jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const display = JOB_DISPLAY[job.jobName] ?? {
              label: job.jobName,
              description: "Custom cron job",
              icon: Timer,
            }
            const Icon = display.icon

            return (
              <div
                key={job.jobName}
                className={cn(
                  "rounded-xl border bg-card p-6 space-y-4",
                  job.isOverdue ? "border-primary/30" : "border-border"
                )}
              >
                {/* Job header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        job.isOverdue
                          ? "bg-primary/15 text-primary"
                          : job.lastStatus === "error"
                            ? "bg-primary/10 text-primary"
                            : "bg-deep text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{display.label}</h3>
                      <p className="text-[11px] text-muted-foreground">{display.description}</p>
                    </div>
                  </div>
                  {/* Status badge */}
                  {job.lastStatus && (
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        job.isOverdue
                          ? "bg-primary/15 text-primary"
                          : job.lastStatus === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-primary/15 text-primary"
                      )}
                    >
                      {job.isOverdue ? (
                        <>
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Overdue
                        </>
                      ) : job.lastStatus === "success" ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          OK
                        </>
                      ) : (
                        <>
                          <XCircle className="h-2.5 w-2.5" />
                          Error
                        </>
                      )}
                    </span>
                  )}
                  {!job.lastStatus && (
                    <span className="flex items-center gap-1 rounded-full bg-deep px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      Never run
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Run</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {job.lastRun ? timeAgo(job.lastRun) : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Time</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {job.avgDuration > 0 ? formatDuration(job.avgDuration) : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Success</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {job.totalRuns > 0
                        ? `${Math.round((job.successCount / job.totalRuns) * 100)}%`
                        : "--"}
                    </p>
                  </div>
                </div>

                {/* Last details */}
                {job.lastDetails && (
                  <div className="rounded-lg bg-deep px-3 py-2">
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{job.lastDetails}</p>
                  </div>
                )}

                {/* Recent executions table */}
                {job.recentExecutions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Recent Executions ({job.recentExecutions.length})
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="bg-deep text-muted-foreground">
                            <th className="text-left px-2 py-1.5 font-medium">Time</th>
                            <th className="text-left px-2 py-1.5 font-medium">Status</th>
                            <th className="text-right px-2 py-1.5 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.recentExecutions.map((exec) => (
                            <tr
                              key={exec.id}
                              className="border-t border-border hover:bg-surface/50"
                            >
                              <td className="px-2 py-1.5 text-muted-foreground">
                                {formatDateTime(exec.createdAt)}
                              </td>
                              <td className="px-2 py-1.5">
                                {exec.status === "success" ? (
                                  <span className="flex items-center gap-1 text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    OK
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-primary">
                                    <XCircle className="h-3 w-3" />
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-right text-muted-foreground">
                                {exec.duration > 0 ? formatDuration(exec.duration) : "--"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expected interval */}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">
                    Expected interval: every {job.expectedIntervalHours}h | Total runs: {job.totalRuns} ({job.successCount} success, {job.errorCount} errors)
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Empty state */}
      {!loading && jobs.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Timer className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No cron execution data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cron jobs will appear here once they have run at least once.
          </p>
        </div>
      )}
    </div>
  )
}
