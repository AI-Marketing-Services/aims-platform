"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react"

interface Slot {
  startAt: string
  endAt: string
}

export function PublicBookingClient({
  handle,
  durationMinutes,
  brandColor,
}: {
  handle: string
  durationMinutes: number
  brandColor: string | null
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Booking form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setLoadingSlots(true)
    fetch(`/api/booking/${handle}/slots`)
      .then((res) => res.json())
      .then((data) => {
        if (data.slots) setSlots(data.slots)
      })
      .catch(() => setError("Couldn't load availability."))
      .finally(() => setLoadingSlots(false))
  }, [handle])

  const slotsByDay = useMemo(() => {
    if (!slots) return new Map<string, Slot[]>()
    const out = new Map<string, Slot[]>()
    for (const s of slots) {
      const d = new Date(s.startAt)
      const key = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
      const arr = out.get(key) ?? []
      arr.push(s)
      out.set(key, arr)
    }
    return out
  }, [slots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/booking/${handle}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: selectedSlot.startAt,
          inviteeName: name.trim(),
          inviteeEmail: email.trim().toLowerCase(),
          inviteePhone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) {
          setError("That slot was just booked. Pick another below.")
          // Refresh slots to drop the now-taken one.
          const refreshed = await fetch(`/api/booking/${handle}/slots`).then(
            (r) => r.json(),
          )
          setSlots(refreshed.slots ?? [])
          setSelectedSlot(null)
        } else {
          throw new Error(data?.error ?? "Booking failed")
        }
        return
      }
      setConfirmed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div
          className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
          style={
            brandColor
              ? { backgroundColor: `${brandColor}20`, color: brandColor }
              : { backgroundColor: "rgb(16 185 129 / 0.1)", color: "rgb(4 120 87)" }
          }
        >
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          You&apos;re booked.
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-1">
          A confirmation will land in your inbox shortly. We&apos;ll see you on{" "}
          <strong>
            {selectedSlot
              ? new Date(selectedSlot.startAt).toLocaleString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : ""}
          </strong>
          .
        </p>
      </div>
    )
  }

  if (selectedSlot) {
    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <button
          type="button"
          onClick={() => setSelectedSlot(null)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Pick a different time
        </button>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
          {new Date(selectedSlot.startAt).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          {" · "}
          {durationMinutes} min
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Your name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            What do you want to talk about?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !name.trim() || !email.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          style={brandColor ? { backgroundColor: brandColor } : undefined}
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {loadingSlots ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          Loading available times…
        </p>
      ) : slots && slots.length > 0 ? (
        <div className="space-y-5">
          {[...slotsByDay.entries()].slice(0, 7).map(([dayLabel, daySlots]) => (
            <div key={dayLabel}>
              <h3 className="text-xs font-bold text-foreground mb-2">
                {dayLabel}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {daySlots.map((s) => (
                  <button
                    key={s.startAt}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
                    style={brandColor ? { borderColor: `${brandColor}40` } : undefined}
                  >
                    {new Date(s.startAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-10">
          No availability in the next 14 days. Please check back later.
        </p>
      )}
    </div>
  )
}
