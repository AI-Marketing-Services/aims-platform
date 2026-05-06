"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Plus,
  Trash2,
  Save,
  Play,
  Pause,
  Send,
  UserPlus,
  Mail,
} from "lucide-react"

interface Step {
  id?: string
  order: number
  delayDays: number
  subject: string
  body: string
}

interface Enrollment {
  id: string
  recipientEmail: string
  recipientName: string | null
  currentStep: number
  status: string
  nextSendAt: string | null
  lastStepSentAt: string | null
  repliedAt: string | null
}

interface Sequence {
  id: string
  name: string
  status: string
  fromName: string | null
  pauseOnReply: boolean
  steps: Step[]
  enrollments: Enrollment[]
}

export function SequenceEditor({ sequence: initial }: { sequence: Sequence }) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [fromName, setFromName] = useState(initial.fromName ?? "")
  const [pauseOnReply, setPauseOnReply] = useState(initial.pauseOnReply)
  const [status, setStatus] = useState(initial.status)
  const [steps, setSteps] = useState<Step[]>(initial.steps)
  const [enrollments, setEnrollments] = useState<Enrollment[]>(
    initial.enrollments,
  )
  const [enrollEmails, setEnrollEmails] = useState("")
  const [saving, setSaving] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateStep = (idx: number, patch: Partial<Step>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    )
  }

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        order: prev.length,
        delayDays: 3,
        subject: "",
        body: "",
      },
    ])
  }

  const removeStep = (idx: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, order: i })),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/portal/sequences/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          fromName: fromName.trim() || null,
          pauseOnReply,
          status,
          steps: steps.map((s, i) => ({
            order: i,
            delayDays: s.delayDays,
            subject: s.subject,
            body: s.body,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Save failed (${res.status})`)
      setMessage("Saved.")
      setTimeout(() => setMessage(null), 2000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleEnroll = async () => {
    const recipients = enrollEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean)
      .map((line) => {
        // Allow "Name <email@x.com>" or just email
        const match = line.match(/^(.*)<([^>]+)>$/)
        if (match) {
          return { name: match[1].trim() || undefined, email: match[2].trim() }
        }
        return { email: line }
      })
      .filter((r) => /\S+@\S+\.\S+/.test(r.email))

    if (recipients.length === 0) {
      setError("Add at least one valid email address.")
      return
    }
    setEnrolling(true)
    setError(null)
    try {
      const res = await fetch(`/api/portal/sequences/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enroll: { recipients } }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Enroll failed (${res.status})`)
      setEnrollments(data.sequence.enrollments)
      setEnrollEmails("")
      setMessage(`Enrolled ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`)
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enroll failed")
    } finally {
      setEnrolling(false)
    }
  }

  const handleSendNext = async () => {
    setSending(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/portal/sequences/${initial.id}/send-step`,
        { method: "POST" },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Send failed (${res.status})`)
      setMessage(
        `Sent ${data.sent} email${data.sent === 1 ? "" : "s"}. ${data.failed > 0 ? `${data.failed} failed.` : ""}`,
      )
      setTimeout(() => setMessage(null), 4000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: settings + steps */}
      <div className="lg:col-span-2 space-y-5">
        {/* Settings */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Settings</h2>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Sequence name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              From name (optional)
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Defaults to your account name"
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={pauseOnReply}
                onChange={(e) => setPauseOnReply(e.target.checked)}
                className="rounded"
              />
              Auto-pause on reply
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <div className="rounded-lg border border-border overflow-hidden flex">
              {["draft", "active", "paused"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 text-xs font-medium ${
                    status === s
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Steps ({steps.length})
            </h2>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
          </div>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border p-4 bg-muted/20 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Step {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    Wait
                    <input
                      type="number"
                      min={0}
                      max={180}
                      value={step.delayDays}
                      onChange={(e) =>
                        updateStep(idx, {
                          delayDays: Math.max(
                            0,
                            parseInt(e.target.value) || 0,
                          ),
                        })
                      }
                      className="w-14 bg-card border border-border rounded px-2 py-0.5 text-xs"
                    />
                    days
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={step.subject}
                onChange={(e) => updateStep(idx, { subject: e.target.value })}
                placeholder="Subject line"
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
              <textarea
                value={step.body}
                onChange={(e) => updateStep(idx, { body: e.target.value })}
                rows={6}
                placeholder="Hi {{contact.firstName}}, ..."
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/40"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message && <span className="text-sm text-emerald-700">{message}</span>}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      {/* Right column: enrollment */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-3">
            <UserPlus className="inline h-4 w-4 mr-1.5 text-primary" />
            Enroll recipients
          </h2>
          <p className="text-[11px] text-muted-foreground mb-3">
            One per line. Format: <code className="px-1 rounded bg-muted">email@x.com</code>{" "}
            or <code className="px-1 rounded bg-muted">Jane Doe &lt;jane@x.com&gt;</code>
          </p>
          <textarea
            value={enrollEmails}
            onChange={(e) => setEnrollEmails(e.target.value)}
            rows={6}
            placeholder="jane@example.com&#10;Bob Builder <bob@example.com>"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/40 mb-3"
          />
          <button
            type="button"
            onClick={handleEnroll}
            disabled={enrolling || !enrollEmails.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 mb-2"
          >
            <UserPlus className="h-4 w-4" />
            {enrolling ? "Enrolling…" : "Enroll batch"}
          </button>
          <button
            type="button"
            onClick={handleSendNext}
            disabled={sending || enrollments.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send next due step"}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20">
            <h2 className="text-sm font-bold text-foreground">
              Enrolled ({enrollments.length})
            </h2>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground p-5 text-center">
              No recipients enrolled yet.
            </p>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {enrollments.map((e) => (
                <div key={e.id} className="px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="font-mono truncate flex-1">
                      {e.recipientEmail}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        e.status === "active"
                          ? "bg-primary/10 text-primary"
                          : e.status === "done"
                            ? "bg-emerald-50 text-emerald-700"
                            : e.status === "replied"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Step {e.currentStep + 1} of {steps.length}
                    {e.nextSendAt && e.status === "active"
                      ? ` · next send ${new Date(e.nextSendAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : null}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
