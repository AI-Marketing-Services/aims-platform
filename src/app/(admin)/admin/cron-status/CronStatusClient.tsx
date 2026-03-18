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
import { cn } from "@/lib/utils"

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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
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
          <h1 className="text-2xl font-bold text-gray-900">Cron Status</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor the health and execution history of scheduled jobs
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Overdue Alert Banner */}
      {overdueJobs.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {overdueJobs.length} cron job{overdueJobs.length > 1 ? "s" : ""} overdue
              </p>
              <p className="text-xs text-red-600 mt-0.5">
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && jobs.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-50 rounded animate-pulse" />
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
                  "rounded-xl border bg-white p-6 space-y-4",
                  job.isOverdue ? "border-red-300" : "border-gray-200"
                )}
              >
                {/* Job header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        job.isOverdue
                          ? "bg-red-100 text-red-600"
                          : job.lastStatus === "error"
                            ? "bg-red-50 text-red-500"
                            : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{display.label}</h3>
                      <p className="text-[11px] text-gray-500">{display.description}</p>
                    </div>
                  </div>
                  {/* Status badge */}
                  {job.lastStatus && (
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        job.isOverdue
                          ? "bg-red-100 text-red-700"
                          : job.lastStatus === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
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
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <Clock className="h-2.5 w-2.5" />
                      Never run
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Last Run</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {job.lastRun ? timeAgo(job.lastRun) : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Time</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {job.avgDuration > 0 ? formatDuration(job.avgDuration) : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Success</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {job.totalRuns > 0
                        ? `${Math.round((job.successCount / job.totalRuns) * 100)}%`
                        : "--"}
                    </p>
                  </div>
                </div>

                {/* Last details */}
                {job.lastDetails && (
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500 line-clamp-2">{job.lastDetails}</p>
                  </div>
                )}

                {/* Recent executions table */}
                {job.recentExecutions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Recent Executions ({job.recentExecutions.length})
                    </p>
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="text-left px-2 py-1.5 font-medium">Time</th>
                            <th className="text-left px-2 py-1.5 font-medium">Status</th>
                            <th className="text-right px-2 py-1.5 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.recentExecutions.map((exec) => (
                            <tr
                              key={exec.id}
                              className="border-t border-gray-50 hover:bg-gray-50/50"
                            >
                              <td className="px-2 py-1.5 text-gray-600">
                                {formatDateTime(exec.createdAt)}
                              </td>
                              <td className="px-2 py-1.5">
                                {exec.status === "success" ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    OK
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-right text-gray-500">
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
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500">
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
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Timer className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No cron execution data yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Cron jobs will appear here once they have run at least once.
          </p>
        </div>
      )}
    </div>
  )
}
