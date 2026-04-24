"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react"

type Stats = {
  total: number
  bySource: Record<string, number>
  lastIndexedAt: string | null
}

type Run = {
  id: string
  status: string
  trigger: string
  startedAt: string
  finishedAt: string | null
  itemsSeen: number
  itemsUpserted: number
  itemsFailed: number
  errorMessage: string | null
}

type Entry = {
  id: string
  source: string
  title: string
  url: string | null
  spaceName: string | null
  publishedAt: string | null
  indexedAt: string
}

type Props = {
  stats: Stats
  runs: Run[]
  entries: Entry[]
  canRun: boolean
}

export function KnowledgeAdminClient({ stats, runs, entries, canRun }: Props) {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  async function runIngest() {
    if (!canRun) {
      toast.error("MIGHTY_API_TOKEN not configured")
      return
    }
    setRunning(true)
    const toastId = toast.loading("Ingesting Mighty content… this can take a minute")
    try {
      const res = await fetch("/api/admin/knowledge/run", { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Ingest failed", { id: toastId })
        return
      }
      toast.success(
        `Ingest ${body.status}. Seen ${body.itemsSeen}, upserted ${body.itemsUpserted}, failed ${body.itemsFailed}`,
        { id: toastId },
      )
      router.refresh()
    } catch {
      toast.error("Network error", { id: toastId })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard label="Total entries" value={stats.total} />
        <StatCard label="Mighty posts" value={stats.bySource["mighty:post"] ?? 0} />
        <StatCard label="Mighty coursework" value={stats.bySource["mighty:coursework"] ?? 0} />
        <StatCard label="Mighty events" value={stats.bySource["mighty:event"] ?? 0} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Last indexed {stats.lastIndexedAt ? new Date(stats.lastIndexedAt).toLocaleString() : "never"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Runs on a schedule via <code className="font-mono text-[10px]">/api/cron/ingest-mighty</code>. Trigger manually here after adding new Mighty content if you don&apos;t want to wait.
          </p>
        </div>
        <button
          onClick={runIngest}
          disabled={!canRun || running}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Running…" : "Run ingest now"}
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent runs</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Seen</th>
                <th className="px-4 py-3 text-right">Upserted</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No ingest runs yet. Click &quot;Run ingest now&quot; to create the first one.
                  </td>
                </tr>
              )}
              {runs.map((r) => {
                const duration =
                  r.finishedAt && r.startedAt
                    ? `${Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s`
                    : "—"
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-xs">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.trigger}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                      {r.errorMessage && (
                        <p className="text-[10px] text-amber-600 mt-1 truncate max-w-xs" title={r.errorMessage}>
                          {r.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{r.itemsSeen}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{r.itemsUpserted}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{r.itemsFailed}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{duration}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent indexed entries</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Space</th>
                <th className="px-4 py-3">Indexed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No entries yet. Run ingest to pull Mighty content.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    {e.url ? (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {e.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>{e.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{e.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.spaceName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.indexedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    running: { label: "Running", cls: "text-primary bg-primary/10", Icon: Clock },
    success: { label: "Success", cls: "text-emerald-700 bg-emerald-500/10", Icon: CheckCircle2 },
    partial: { label: "Partial", cls: "text-amber-700 bg-amber-500/10", Icon: AlertCircle },
    error: { label: "Error", cls: "text-red-700 bg-red-500/10", Icon: AlertCircle },
  }
  const entry = map[status] ?? map.running
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${entry.cls}`}>
      <entry.Icon className="h-3 w-3" />
      {entry.label}
    </span>
  )
}
