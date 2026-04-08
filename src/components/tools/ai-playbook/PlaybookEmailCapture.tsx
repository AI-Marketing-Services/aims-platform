"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react"

interface Props {
  variant?: "hero" | "footer"
}

export function PlaybookEmailCapture({ variant = "hero" }: Props) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "W2_PLAYBOOK",
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          source: variant === "hero" ? "ai-playbook-hero" : "ai-playbook-footer",
          data: { source: variant },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? "Submission failed")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-6 text-center max-w-md mx-auto">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-foreground font-semibold text-lg">Check your inbox.</p>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          The full playbook PDF + welcome email is on its way. If you don&apos;t see it
          in 2 minutes, check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3.5 bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3.5 bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(196,151,42,0.25)]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Me the Playbook <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && <p className="text-xs text-primary text-center">{error}</p>}
      <p className="text-xs text-center text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
        <Lock className="w-3 h-3" />
        Three emails total. Unsubscribe anytime.
      </p>
    </form>
  )
}
