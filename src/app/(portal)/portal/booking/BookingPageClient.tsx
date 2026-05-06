"use client"

import { useState } from "react"
import {
  Save,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  AlertCircle,
} from "lucide-react"

interface Availability {
  handle: string
  isActive: boolean
  durationMinutes: number
  bufferMinutes: number
  timezone: string
  weeklyHours: Record<string, Array<{ start: string; end: string }>>
  welcomeTitle: string
  welcomeBody: string
}

interface Booking {
  id: string
  inviteeName: string
  inviteeEmail: string
  startAt: string
  endAt: string
  notes: string | null
}

const DAY_LABELS: Array<[keyof Availability["weeklyHours"], string]> = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
]

export function BookingPageClient({
  suggestedHandle,
  defaultWeeklyHours,
  initialAvailability,
  upcomingBookings,
}: {
  suggestedHandle: string
  defaultWeeklyHours: Record<string, Array<{ start: string; end: string }>>
  initialAvailability: Availability | null
  upcomingBookings: Booking[]
}) {
  const [handle, setHandle] = useState(
    initialAvailability?.handle ?? suggestedHandle,
  )
  const [isActive, setIsActive] = useState(
    initialAvailability?.isActive ?? true,
  )
  const [durationMinutes, setDurationMinutes] = useState(
    initialAvailability?.durationMinutes ?? 30,
  )
  const [bufferMinutes, setBufferMinutes] = useState(
    initialAvailability?.bufferMinutes ?? 15,
  )
  const [timezone, setTimezone] = useState(
    initialAvailability?.timezone ?? "America/Los_Angeles",
  )
  const [weeklyHours, setWeeklyHours] = useState(
    initialAvailability?.weeklyHours ?? defaultWeeklyHours,
  )
  const [welcomeTitle, setWelcomeTitle] = useState(
    initialAvailability?.welcomeTitle ?? "",
  )
  const [welcomeBody, setWelcomeBody] = useState(
    initialAvailability?.welcomeBody ?? "",
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const updateDay = (
    day: string,
    windows: Array<{ start: string; end: string }>,
  ) => {
    setWeeklyHours((prev) => ({ ...prev, [day]: windows }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/portal/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.toLowerCase().trim(),
          isActive,
          durationMinutes,
          bufferMinutes,
          timezone,
          weeklyHours,
          welcomeTitle: welcomeTitle.trim() || undefined,
          welcomeBody: welcomeBody.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Save failed (${res.status})`)
      setMessage("Saved.")
      setTimeout(() => setMessage(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const publicUrl =
    typeof window !== "undefined" && handle.trim()
      ? `${window.location.origin}/book/${handle.trim()}`
      : `/book/${handle.trim()}`

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: settings */}
      <div className="lg:col-span-2 space-y-5">
        {/* Handle + status */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Public URL handle
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {typeof window !== "undefined" ? window.location.origin : ""}/book/
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                maxLength={40}
                pattern="[a-z0-9-]+"
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/40"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                title="Copy URL"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                title="Open public booking page"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            Booking page is live
          </label>
        </div>

        {/* Duration + buffer */}
        <div className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Meeting length (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(Math.max(5, parseInt(e.target.value) || 30))
              }
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Buffer between meetings (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={bufferMinutes}
              onChange={(e) =>
                setBufferMinutes(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          >
            {[
              "America/Los_Angeles",
              "America/Denver",
              "America/Chicago",
              "America/New_York",
              "America/Toronto",
              "Europe/London",
              "Europe/Berlin",
              "Asia/Singapore",
              "Asia/Tokyo",
              "Australia/Sydney",
            ].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Weekly hours */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-3">
            Weekly availability
          </h2>
          <div className="space-y-3">
            {DAY_LABELS.map(([key, label]) => {
              const windows = weeklyHours[key as string] ?? []
              const isAvailable = windows.length > 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-32 text-sm">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateDay(key as string, [
                            { start: "09:00", end: "17:00" },
                          ])
                        } else {
                          updateDay(key as string, [])
                        }
                      }}
                      className="rounded"
                    />
                    {label}
                  </label>
                  {isAvailable && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={windows[0].start}
                        onChange={(e) =>
                          updateDay(key as string, [
                            { ...windows[0], start: e.target.value },
                          ])
                        }
                        className="bg-card border border-border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <input
                        type="time"
                        value={windows[0].end}
                        onChange={(e) =>
                          updateDay(key as string, [
                            { ...windows[0], end: e.target.value },
                          ])
                        }
                        className="bg-card border border-border rounded px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Welcome copy */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-foreground">
            Welcome message (optional)
          </h2>
          <input
            type="text"
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
            placeholder="Let's chat about your AI strategy"
            maxLength={120}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
          <textarea
            value={welcomeBody}
            onChange={(e) => setWelcomeBody(e.target.value)}
            placeholder="30-min discovery call. Tell me a bit about your business…"
            rows={4}
            maxLength={2000}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save settings"}
          </button>
          {message && <span className="text-sm text-emerald-700">{message}</span>}
        </div>
      </div>

      {/* Right: upcoming bookings */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Upcoming bookings
            </h2>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground p-5 text-center">
              No bookings yet. Share your link!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="px-4 py-3 text-xs">
                  <p className="font-bold text-foreground">{b.inviteeName}</p>
                  <p className="font-mono text-muted-foreground truncate">
                    {b.inviteeEmail}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {new Date(b.startAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {b.notes && (
                    <p className="text-muted-foreground mt-1 italic line-clamp-2">
                      {b.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
