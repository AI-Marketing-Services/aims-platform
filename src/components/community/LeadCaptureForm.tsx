"use client"

import { useState } from "react"
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface LeadCaptureFormProps {
  source?: string
  variant?: "inline" | "stacked"
  ctaLabel?: string
}

export function LeadCaptureForm({
  source = "hero",
  variant = "inline",
  ctaLabel = "Apply for Next Cohort",
}: LeadCaptureFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/community/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), source }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Submission failed")
      }

      setSuccess(true)
      toast.success("Check your inbox — the Playbook Vault is on its way.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-aims-gold/40 bg-aims-gold/5 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-aims-gold mx-auto mb-3" />
        <p className="text-cream font-semibold text-lg">Check your inbox.</p>
        <p className="text-cream/70 text-sm mt-2 leading-relaxed">
          The <span className="text-aims-gold font-semibold">AI Operator Playbook Vault</span>{" "}
          is on its way right now. If you don&apos;t see it in 2 minutes, check your spam or
          promotions folder — it&apos;s worth digging for.
        </p>
        <p className="text-cream/45 text-xs mt-3 font-mono uppercase tracking-wider">
          Your application is in the review queue
        </p>
      </div>
    )
  }

  if (variant === "stacked") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md mx-auto">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-sm bg-surface border border-line px-4 py-3.5 text-cream placeholder:text-cream/40 focus:outline-none focus:border-aims-gold transition-colors"
          required
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm bg-surface border border-line px-4 py-3.5 text-cream placeholder:text-cream/40 focus:outline-none focus:border-aims-gold transition-colors"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(196,151,42,0.25)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{ctaLabel} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 p-2 rounded-md bg-surface border border-line"
    >
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-transparent px-3 py-3 text-cream placeholder:text-cream/40 focus:outline-none"
        required
      />
      <div className="hidden sm:block w-px bg-line" />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent px-3 py-3 text-cream placeholder:text-cream/40 focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-sm bg-aims-gold text-ink px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{ctaLabel} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  )
}
