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
      <div className="rounded-lg border border-crimson/30 bg-crimson/5 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-crimson mx-auto mb-3" />
        <p className="text-[#1A1A1A] font-semibold text-lg">Check your inbox.</p>
        <p className="text-[#4B5563] text-sm mt-2 leading-relaxed">
          The <span className="text-crimson font-semibold">AI Operator Playbook Vault</span>{" "}
          is on its way right now. If you don&apos;t see it in 2 minutes, check your spam or
          promotions folder — it&apos;s worth digging for.
        </p>
        <p className="text-[#737373] text-xs mt-3 font-mono uppercase tracking-wider">
          Your application is in the review queue
        </p>
      </div>
    )
  }

  if (variant === "stacked") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md mx-auto">
        <label className="sr-only" htmlFor="lead-capture-name">Your name</label>
        <input
          id="lead-capture-name"
          type="text"
          placeholder="Your name"
          aria-label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md bg-white border border-[#E3E3E3] px-4 py-3.5 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-colors"
          required
        />
        <label className="sr-only" htmlFor="lead-capture-email">Your email</label>
        <input
          id="lead-capture-email"
          type="email"
          placeholder="Your email"
          aria-label="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md bg-white border border-[#E3E3E3] px-4 py-3.5 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-colors"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-crimson text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{ctaLabel} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 p-2 rounded-md bg-white border border-[#E3E3E3]"
    >
      <label className="sr-only" htmlFor="lead-capture-name-inline">Your name</label>
      <input
        id="lead-capture-name-inline"
        type="text"
        placeholder="Your name"
        aria-label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-transparent px-3 py-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none"
        required
      />
      <div className="hidden sm:block w-px bg-[#E3E3E3]" />
      <label className="sr-only" htmlFor="lead-capture-email-inline">Your email</label>
      <input
        id="lead-capture-email-inline"
        type="email"
        placeholder="Your email"
        aria-label="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent px-3 py-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-crimson text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-crimson-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shadow-[0_4px_12px_-2px_rgba(153,27,27,0.25)]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{ctaLabel} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  )
}
