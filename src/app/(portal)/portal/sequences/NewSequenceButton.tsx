"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus } from "lucide-react"

const STARTER_SEQUENCE = {
  name: "Cold outreach (4 steps)",
  pauseOnReply: true,
  steps: [
    {
      order: 0,
      delayDays: 0,
      subject: "Quick question, {{contact.firstName}}",
      body:
        "Hey {{contact.firstName}},\n\nNoticed {{company.name}} and wanted to reach out — we help operators like you ship more deals with less manual work.\n\nWorth a 15-min chat next week?\n\n— {{operator.firstName}}",
    },
    {
      order: 1,
      delayDays: 3,
      subject: "Re: quick question",
      body:
        "Hey {{contact.firstName}}, just bumping this up in your inbox.\n\nIf the timing's off, no worries — happy to circle back later.\n\n— {{operator.firstName}}",
    },
    {
      order: 2,
      delayDays: 5,
      subject: "Worth 15 minutes?",
      body:
        "{{contact.firstName}} — last note from me on this thread.\n\nIf there's a better time of year, just reply &ldquo;later&rdquo; and I'll set a reminder for Q2.\n\n— {{operator.firstName}}",
    },
    {
      order: 3,
      delayDays: 7,
      subject: "Closing the loop",
      body:
        "{{contact.firstName}}, closing this thread out.\n\nIf {{company.name}} ever wants to revisit, my calendar is always open.\n\nGood luck out there,\n{{operator.firstName}}",
    },
  ],
}

export function NewSequenceButton({ label = "New sequence" }: { label?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(STARTER_SEQUENCE),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Failed (${res.status})`)
      router.push(`/portal/sequences/${data.sequence.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create")
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        {busy ? "Creating…" : label}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
