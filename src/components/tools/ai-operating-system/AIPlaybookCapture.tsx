"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2, Lock, Download } from "lucide-react"

interface Props {
  variant?: "hero" | "footer"
}

export function AIPlaybookCapture({ variant = "hero" }: Props) {
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
      const res = await fetch("/api/lead-magnets/ai-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          source: variant === "hero" ? "ai-os-playbook-hero" : "ai-os-playbook-footer",
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
      <div className="rounded-md border border-crimson/30 bg-crimson/5 p-6 text-center max-w-md mx-auto">
        <CheckCircle2 className="w-10 h-10 text-crimson mx-auto mb-3" />
        <p className="text-[#1A1A1A] font-semibold text-lg">Your playbook is on the way.</p>
        <p className="text-[#737373] text-sm mt-2 leading-relaxed">
          Check your inbox for the AI Operating System Playbook PDF.
          If you do not see it in 2 minutes, check your spam folder.
        </p>
        <a
          href="/api/lead-magnets/ai-playbook"
          className="inline-flex items-center gap-2 mt-4 text-sm text-crimson font-semibold hover:underline"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF directly
        </a>
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
        className="w-full px-4 py-3.5 bg-white border border-[#E3E3E3] rounded-md text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors text-base"
      />
      <input
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3.5 bg-white border border-[#E3E3E3] rounded-md text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors text-base"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-crimson text-white font-bold text-sm uppercase tracking-wider rounded-md hover:bg-crimson-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Get the Free Playbook <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && <p className="text-xs text-crimson text-center">{error}</p>}
      <p className="text-xs text-center text-[#737373] inline-flex items-center justify-center gap-1.5 w-full">
        <Lock className="w-3 h-3" />
        PDF delivered instantly. No spam.
      </p>
    </form>
  )
}
