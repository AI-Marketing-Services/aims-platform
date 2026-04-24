'use client'

import { useState, useCallback, useEffect } from 'react'
import { Copy, Check, RefreshCw, Info } from 'lucide-react'
import { DomainStatusPill } from './domain-status-pill'

type DnsRecord = {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  status: 'detected' | 'waiting' | 'unchecked' | 'misconfigured'
  friendlyLabel: string
}

function useRelativeTime(date: Date | null | undefined): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!date) {
      setLabel('')
      return
    }

    const update = () => {
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
      if (seconds < 60) setLabel(`${seconds}s ago`)
      else if (seconds < 3600) setLabel(`${Math.floor(seconds / 60)}m ago`)
      else setLabel(`${Math.floor(seconds / 3600)}h ago`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [date])

  return label
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
      className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  )
}

export function DnsInstructions({
  domain,
  records,
  onRecheck,
  isChecking = false,
  lastCheckedAt,
}: {
  domain: string
  records: DnsRecord[]
  onRecheck?: () => void
  isChecking?: boolean
  lastCheckedAt?: Date | null
}) {
  const relativeTime = useRelativeTime(lastCheckedAt)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Point{' '}
              <span className="font-mono text-[#C4972A]">{domain}</span>{' '}
              to AIMS
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add the records below to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).
              DNS changes take 5 minutes to 48 hours. We check automatically every 10 seconds.
            </p>
          </div>
          <button
            onClick={onRecheck}
            disabled={isChecking || !onRecheck}
            aria-label="Re-check DNS records"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`}
              aria-hidden
            />
            {isChecking ? 'Checking…' : 'Check now'}
          </button>
        </div>

        {lastCheckedAt && relativeTime && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Last checked {relativeTime}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                What this does
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Copy
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                  {record.friendlyLabel}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                    {record.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-[#C4972A]">{record.name}</span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {record.value}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <CopyButton value={record.value} />
                </td>
                <td className="px-4 py-3">
                  <DomainStatusPill status={record.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registrar tip */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden />
        <p className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">GoDaddy tip:</strong> Some registrars automatically
          append a trailing dot to TXT record names — that&apos;s normal and won&apos;t break anything.
        </p>
      </div>
    </div>
  )
}
