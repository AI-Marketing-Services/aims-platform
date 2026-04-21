"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2 } from "lucide-react"

export default function UnlockForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/ideas/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        setError("Wrong password")
        setBusy(false)
      }
    } catch {
      setError("Network error")
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[420px] pt-20">
      <div className="flex items-center justify-center mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
      </div>
      <h1 className="font-serif text-3xl text-center text-foreground mb-2">Lead Magnets</h1>
      <p className="text-foreground/60 text-sm text-center mb-10 font-mono">
        enter password to continue
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          autoComplete="current-password"
          className="w-full bg-transparent border-b border-border/50 focus:border-primary outline-none py-3 text-center text-base font-mono placeholder:text-foreground/30"
        />
        {error && (
          <div className="text-xs text-red-400 font-mono text-center">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy || !password.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-background px-6 py-3 rounded-[2px] font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          unlock
        </button>
      </form>
    </div>
  )
}
