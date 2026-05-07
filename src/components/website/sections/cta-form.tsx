"use client"

import { useState } from "react"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import type { CtaFormContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: CtaFormContent
  brand: SectionBrand
}

/**
 * Final-conversion CTA section. Visitor enters name + email + message,
 * we POST to /api/tenant/lead which creates a ClientDeal under the
 * operator's userId. The operator sees the lead in their CRM
 * immediately with `source: website` for analytics.
 *
 * Brand-aware: button + focus ring use the operator's primary color.
 * Success state stays on the page so we don't lose visitors who
 * intended to keep scrolling.
 */
export function CtaForm({ content, brand }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || done) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/tenant/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Existing endpoint contract — `resellerId` is the operator's
          // userId; the route validates ownership of the published site
          // before tagging the captured Deal.
          resellerId: brand.operatorUserId,
          name,
          email,
          message,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Could not send. Try again in a moment.")
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSubmitting(false)
    }
  }

  const buttonLabel = content.buttonLabel?.trim() || "Send message"
  const successCopy =
    content.successMessage?.trim() ||
    `Thanks — we'll be in touch within one business day.`

  return (
    <section
      id="contact"
      className="px-6 py-24 sm:py-28"
      style={{
        background: `linear-gradient(180deg, ${brand.primaryColor} 0%, ${brand.accentColor} 100%)`,
      }}
      aria-labelledby="cta-form-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        {content.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            {content.eyebrow}
          </p>
        )}

        <h2
          id="cta-form-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: brand.fontHeading }}
        >
          {content.heading}
        </h2>

        {content.subheading && (
          <p className="mt-4 text-base leading-relaxed text-white/85">
            {content.subheading}
          </p>
        )}

        {done ? (
          <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white backdrop-blur">
            <Check className="h-4 w-4" aria-hidden />
            {successCopy}
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-2 shadow-xl"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border-0 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2"
                style={{
                  boxShadow: "inset 0 0 0 1px rgb(229 229 229)",
                }}
                maxLength={120}
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border-0 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2"
                style={{
                  boxShadow: "inset 0 0 0 1px rgb(229 229 229)",
                }}
                maxLength={200}
              />
            </div>

            <textarea
              rows={3}
              required
              placeholder="What are you looking for help with?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 resize-y"
              style={{
                boxShadow: "inset 0 0 0 1px rgb(229 229 229)",
              }}
              maxLength={2000}
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Sending…
                </>
              ) : (
                <>
                  {buttonLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>

            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
