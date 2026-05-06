"use client"

import { useState } from "react"
import {
  Sparkles,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface Deal {
  id: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
}

interface ClientUpdate {
  id: string
  clientDealId: string | null
  status: string
  weekStartDate: string
  subject: string
  body: string
  sentAt: string | null
  updatedAt: string
}

export function ClientUpdatesClient({
  activeDeals,
  initialUpdates,
}: {
  activeDeals: Deal[]
  initialUpdates: ClientUpdate[]
}) {
  const [updates, setUpdates] = useState<ClientUpdate[]>(initialUpdates)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleGenerate = async (dealId: string) => {
    setGeneratingFor(dealId)
    setError(null)
    try {
      const res = await fetch("/api/portal/client-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientDealId: dealId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.error ?? `Generation failed (${res.status})`)
      setUpdates((prev) => [
        {
          ...data.update,
          weekStartDate: data.update.weekStartDate,
          updatedAt: data.update.updatedAt,
          sentAt: null,
        },
        ...prev,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleSend = async (id: string) => {
    if (
      !confirm(
        "Send this update email to the linked deal's primary contact? Make sure the body looks right.",
      )
    )
      return
    setSending(id)
    setError(null)
    try {
      const res = await fetch(`/api/portal/client-updates/${id}/send`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Send failed (${res.status})`)
      setUpdates((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: "sent", sentAt: new Date().toISOString() }
            : u,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active retainers — generate buttons */}
      <section>
        <h2 className="text-sm font-bold text-foreground mb-3">
          Generate this week&apos;s recap
        </h2>
        {activeDeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No active retainers yet. Move deals to <strong>Active Retainer</strong>{" "}
              in your CRM to use this feature.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDeals.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="font-semibold text-foreground truncate">
                  {d.companyName}
                </p>
                <p className="text-xs text-muted-foreground truncate mb-3">
                  {d.contactName ?? "—"}
                  {d.contactEmail ? ` · ${d.contactEmail}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerate(d.id)}
                  disabled={generatingFor === d.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingFor === d.id ? "Drafting…" : "Generate draft"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Drafts + sent */}
      <section>
        <h2 className="text-sm font-bold text-foreground mb-3">Recent updates</h2>
        {updates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No updates yet. Generate one above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">
                      {u.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Sent{" "}
                        {u.sentAt
                          ? new Date(u.sentAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4">
                  {editingId === u.id ? (
                    <textarea
                      defaultValue={u.body}
                      rows={12}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/40"
                      onBlur={() => setEditingId(null)}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                      {u.body}
                    </pre>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/10">
                  {u.status !== "sent" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId((prev) => (prev === u.id ? null : u.id))
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      >
                        {editingId === u.id ? "Done editing" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSend(u.id)}
                        disabled={sending === u.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        {sending === u.id ? "Sending…" : "Send"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
