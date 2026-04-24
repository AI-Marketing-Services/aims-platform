'use client'

import { useState } from 'react'
import type { TenantContext } from '@/components/providers/tenant-theme-provider'

type Props = {
  tenant: TenantContext
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function LandingCtaForm({ tenant }: Props) {
  const { brand, reseller, operatorSite } = tenant
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    const form = e.currentTarget
    const data = new FormData(form)

    setStatus('submitting')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/tenant/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resellerId: reseller.id,
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          company: String(data.get('company') ?? ''),
          phone: String(data.get('phone') ?? ''),
          message: String(data.get('message') ?? ''),
          subdomain: operatorSite.subdomain,
          customDomain: operatorSite.customDomain ?? undefined,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}) as { error?: string })
        setErrorMsg(payload.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      form.reset()
      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md rounded-md bg-[#08090D]/10 p-6 text-center text-[#08090D]">
        <h3 className="text-lg font-semibold">Thanks — we got it.</h3>
        <p className="mt-2 text-sm text-[#08090D]/80">
          {brand.businessName} will be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-md gap-3 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            required
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-md border border-[#08090D]/20 bg-[#F0EBE0] px-4 py-2.5 text-sm text-[#08090D] placeholder:text-[#08090D]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#08090D]"
          />
        </label>
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            className="w-full rounded-md border border-[#08090D]/20 bg-[#F0EBE0] px-4 py-2.5 text-sm text-[#08090D] placeholder:text-[#08090D]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#08090D]"
          />
        </label>
      </div>
      <label className="block">
        <span className="sr-only">Company</span>
        <input
          type="text"
          name="company"
          autoComplete="organization"
          placeholder="Company (optional)"
          className="w-full rounded-md border border-[#08090D]/20 bg-[#F0EBE0] px-4 py-2.5 text-sm text-[#08090D] placeholder:text-[#08090D]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#08090D]"
        />
      </label>
      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          name="message"
          rows={3}
          placeholder="What are you looking for help with?"
          className="w-full rounded-md border border-[#08090D]/20 bg-[#F0EBE0] px-4 py-2.5 text-sm text-[#08090D] placeholder:text-[#08090D]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#08090D]"
        />
      </label>
      <input type="hidden" name="phone" value="" />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[#08090D] px-7 py-3 text-sm font-semibold text-[#F0EBE0] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#08090D] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : `Contact ${brand.businessName}`}
      </button>

      {status === 'error' && errorMsg && (
        <p role="alert" className="text-sm text-red-800">
          {errorMsg}
        </p>
      )}
    </form>
  )
}
