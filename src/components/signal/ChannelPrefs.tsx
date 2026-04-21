"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

type Prefs = {
  notifSignalDigest: boolean
  signalSmsOptIn: boolean
  signalPhoneE164: string | null
}

export function ChannelPrefs({ initial, email }: { initial: Prefs; email: string }) {
  const [prefs, setPrefs] = useState(initial)
  const [phone, setPhone] = useState(initial.signalPhoneE164 ?? "")
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(patch: Partial<Prefs> & { signalPhoneE164?: string | null }, key: string) {
    setError(null)
    setSaving(key)
    try {
      const res = await fetch("/api/signal/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save")
        return false
      }
      setPrefs(data)
      return true
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <Row
        label="Email"
        detail={email}
        enabled={prefs.notifSignalDigest}
        busy={saving === "email"}
        onToggle={() => save({ notifSignalDigest: !prefs.notifSignalDigest }, "email")}
      />

      <div className="space-y-3">
        <Row
          label="SMS (Blooio)"
          detail={prefs.signalPhoneE164 ?? "add a phone below"}
          enabled={prefs.signalSmsOptIn}
          busy={saving === "sms"}
          disabled={!prefs.signalPhoneE164}
          onToggle={() => save({ signalSmsOptIn: !prefs.signalSmsOptIn }, "sms")}
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const ok = await save({ signalPhoneE164: phone || null }, "phone")
            if (ok) setPhone(phone)
          }}
          className="flex items-center gap-2 pl-5"
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            className="flex-1 bg-transparent border-b border-border/40 focus:border-primary outline-none py-1 text-sm font-mono placeholder:text-foreground/30"
          />
          <button
            type="submit"
            disabled={saving === "phone" || phone === (prefs.signalPhoneE164 ?? "")}
            className="text-xs font-mono uppercase tracking-wider text-primary hover:opacity-80 disabled:opacity-30"
          >
            {saving === "phone" ? <Loader2 className="h-3 w-3 animate-spin" /> : "save"}
          </button>
        </form>
      </div>

      {error && <div className="text-xs text-red-400 font-mono">{error}</div>}
    </div>
  )
}

function Row({
  label,
  detail,
  enabled,
  busy,
  disabled,
  onToggle,
}: {
  label: string
  detail: string
  enabled: boolean
  busy: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-foreground/90">{label}</div>
        <div className="text-xs text-foreground/50 font-mono mt-0.5">{detail}</div>
      </div>
      <button
        onClick={onToggle}
        disabled={busy || disabled}
        aria-pressed={enabled}
        className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${enabled ? "bg-primary" : "bg-foreground/15"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${enabled ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  )
}
