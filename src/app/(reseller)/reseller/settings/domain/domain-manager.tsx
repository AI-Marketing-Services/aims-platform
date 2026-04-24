"use client"

import { useState, useEffect, useCallback, useRef, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Globe, CheckCircle2, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { DnsInstructions } from "@/components/reseller/domain/dns-instructions"
import { isReservedSubdomain } from "@/lib/tenant/reserved-subdomains"

const PLATFORM_HOST = "aioperatorcollective.com"
const SUBDOMAIN_REGEX = /^[a-z0-9-]{3,30}$/

const POLL_INTERVAL_MS = 10_000
const POLL_CAP_MS = 30 * 60 * 1000

type DnsRecordShape = {
  type: "A" | "CNAME" | "TXT"
  name: string
  value: string
  status: "detected" | "waiting" | "unchecked" | "misconfigured"
  friendlyLabel: string
}

interface DomainStatusPayload {
  domain: string
  verified: boolean
  published: boolean
  records: DnsRecordShape[]
}

interface Props {
  initialSubdomain: string
  initialCustomDomain: string | null
  initialVerified: boolean
  initialPublished: boolean
  vercelConfigured: boolean
}

function validateSubdomain(value: string): string | null {
  if (!value) return "Subdomain is required."
  if (!SUBDOMAIN_REGEX.test(value)) {
    return "Only lowercase letters, numbers, and hyphens. 3–30 characters."
  }
  if (isReservedSubdomain(value)) {
    return `"${value}" is a reserved subdomain.`
  }
  return null
}

function SubdomainSection({
  initial,
  onSaved,
}: {
  initial: string
  onSaved?: (sub: string) => void
}) {
  const [subdomain, setSubdomain] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setSubdomain(v)
    setError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const err = validateSubdomain(subdomain)
    if (err) {
      setError(err)
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/reseller/site", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain }),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to save subdomain")
          return
        }
        toast.success("Subdomain saved")
        onSaved?.(subdomain)
      } catch {
        toast.error("Failed to save — please try again")
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Platform Subdomain</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a unique slug for your white-label portal.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center">
            <input
              type="text"
              value={subdomain}
              onChange={handleChange}
              placeholder="acme"
              maxLength={30}
              className="h-9 w-40 rounded-l-md border border-border border-r-0 bg-surface px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary"
              aria-label="Subdomain slug"
              aria-describedby={error ? "subdomain-error" : "subdomain-preview"}
            />
            <span className="h-9 flex items-center px-3 text-sm text-muted-foreground bg-muted border border-border rounded-r-md border-l-0 whitespace-nowrap select-none">
              .{PLATFORM_HOST}
            </span>
          </div>
          {error ? (
            <p id="subdomain-error" className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : subdomain && !validateSubdomain(subdomain) ? (
            <p id="subdomain-preview" className="text-xs text-muted-foreground">
              Your site will be live at{" "}
              <span className="font-mono text-[#C4972A]">
                {subdomain}.{PLATFORM_HOST}
              </span>
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isPending || !!validateSubdomain(subdomain)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isPending ? "Saving…" : "Save Subdomain"}
        </button>
      </form>
    </div>
  )
}

function PublishToggle({
  published,
  verified,
  onChange,
}: {
  published: boolean
  verified: boolean
  onChange: (v: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const disabled = !verified || isPending

  function toggle() {
    if (disabled) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/reseller/site", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !published }),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to update publish status")
          return
        }
        onChange(!published)
        toast.success(published ? "Site unpublished" : "Site published — you're live!")
      } catch {
        toast.error("Failed to update — please try again")
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={published}
        aria-label={published ? "Unpublish site" : "Publish site"}
        className="flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        ) : published ? (
          <ToggleRight className="h-8 w-8 text-emerald-400" aria-hidden />
        ) : (
          <ToggleLeft className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
        )}
        <span className="text-sm font-medium text-foreground">
          {published ? "Published — site is live" : "Unpublished"}
        </span>
      </button>
      {!verified && (
        <p className="text-xs text-muted-foreground">
          Verify your domain to enable publishing.
        </p>
      )}
    </div>
  )
}

export function DomainManager({
  initialSubdomain,
  initialCustomDomain,
  initialVerified,
  initialPublished,
  vercelConfigured,
}: Props) {
  const [customDomain, setCustomDomain] = useState(initialCustomDomain)
  const [verified, setVerified] = useState(initialVerified)
  const [published, setPublished] = useState(initialPublished)
  const [dnsRecords, setDnsRecords] = useState<DnsRecordShape[]>([])
  const [addInput, setAddInput] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, startAddTransition] = useTransition()
  const [isRemoving, startRemoveTransition] = useTransition()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollStartRef = useRef<number | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch current domain status
  // ---------------------------------------------------------------------------
  const fetchStatus = useCallback(async () => {
    if (!customDomain) return
    setIsChecking(true)
    try {
      const res = await fetch("/api/reseller/domain")
      if (!res.ok) return
      const data = (await res.json()) as DomainStatusPayload
      setDnsRecords(data.records ?? [])
      setVerified(data.verified ?? false)
      setPublished(data.published ?? false)
      setLastCheckedAt(new Date())
      if (data.verified) {
        stopPolling()
      }
    } catch {
      // silent — polling path
    } finally {
      setIsChecking(false)
    }
  }, [customDomain])

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------
  function startPolling() {
    pollStartRef.current = Date.now()
    scheduleNextPoll()
  }

  function stopPolling() {
    if (pollRef.current) {
      clearTimeout(pollRef.current)
      pollRef.current = null
    }
  }

  function scheduleNextPoll() {
    pollRef.current = setTimeout(async () => {
      if (pollStartRef.current && Date.now() - pollStartRef.current > POLL_CAP_MS) {
        stopPolling()
        return
      }
      await fetchStatus()
      if (!verified) scheduleNextPoll()
    }, POLL_INTERVAL_MS)
  }

  useEffect(() => {
    if (customDomain && !initialVerified) {
      fetchStatus()
      startPolling()
    }
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDomain])

  // ---------------------------------------------------------------------------
  // Add domain
  // ---------------------------------------------------------------------------
  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const raw = addInput.trim().toLowerCase()
    if (!raw || raw.length < 4) {
      setAddError("Enter a valid domain name.")
      return
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) {
      setAddError("Invalid domain format. Example: mysite.com")
      return
    }
    setAddError(null)

    startAddTransition(async () => {
      try {
        const res = await fetch("/api/reseller/domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: raw }),
        })
        const data = (await res.json()) as { domain?: string; records?: DnsRecordShape[]; error?: string }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to add domain")
          return
        }
        setCustomDomain(data.domain ?? raw)
        setDnsRecords(data.records ?? [])
        setVerified(false)
        setAddInput("")
        toast.success("Domain added — configure your DNS records below.")
        startPolling()
      } catch {
        toast.error("Failed to add domain — please try again")
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Remove domain
  // ---------------------------------------------------------------------------
  function handleRemove() {
    startRemoveTransition(async () => {
      try {
        const res = await fetch("/api/reseller/domain", { method: "DELETE" })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to remove domain")
          return
        }
        stopPolling()
        setCustomDomain(null)
        setDnsRecords([])
        setVerified(false)
        setPublished(false)
        toast.success("Custom domain removed")
      } catch {
        toast.error("Failed to remove domain — please try again")
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Manual check
  // ---------------------------------------------------------------------------
  async function handleCheckNow() {
    try {
      setIsChecking(true)
      const res = await fetch("/api/reseller/domain/verify", { method: "POST" })
      const data = (await res.json()) as { verified?: boolean; records?: DnsRecordShape[]; error?: string }
      if (data.verified) {
        setVerified(true)
        stopPolling()
        toast.success("Domain verified! You can now publish your site.")
      } else {
        toast.info("Not verified yet — DNS changes can take up to 48 hours.")
      }
      if (data.records) setDnsRecords(data.records)
      setLastCheckedAt(new Date())
    } catch {
      toast.error("Check failed — please try again")
    } finally {
      setIsChecking(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Subdomain */}
      <SubdomainSection initial={initialSubdomain} />

      {/* Custom domain */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Custom Domain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your own domain (e.g. portal.mycompany.com) to your white-label site.
          </p>
        </div>

        {!vercelConfigured ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-300">
              Custom domain connection is coming soon — set up your platform subdomain for now.
            </p>
          </div>
        ) : !customDomain ? (
          /* Add domain form */
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="customDomain"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Domain Name
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 h-9 rounded-md border border-border bg-surface px-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden />
                  <input
                    id="customDomain"
                    type="text"
                    value={addInput}
                    onChange={(e) => {
                      setAddInput(e.target.value)
                      setAddError(null)
                    }}
                    placeholder="portal.mycompany.com"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAdding || !addInput.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isAdding && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {isAdding ? "Adding…" : "Add Domain"}
                </button>
              </div>
              {addError && (
                <p className="text-xs text-red-400" role="alert">
                  {addError}
                </p>
              )}
            </div>
          </form>
        ) : verified ? (
          /* Verified state */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                <span className="text-sm font-medium text-foreground">
                  Live at{" "}
                  <a
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C4972A] hover:underline font-mono"
                  >
                    {customDomain}
                  </a>
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
                {isRemoving ? "Removing…" : "Remove"}
              </button>
            </div>

            <PublishToggle
              published={published}
              verified={verified}
              onChange={setPublished}
            />
          </div>
        ) : (
          /* Unverified — show DNS instructions + polling */
          <div className="space-y-4">
            <DnsInstructions
              domain={customDomain}
              records={dnsRecords}
              onRecheck={handleCheckNow}
              isChecking={isChecking}
              lastCheckedAt={lastCheckedAt}
            />

            <div className="flex items-center justify-between">
              <PublishToggle
                published={published}
                verified={false}
                onChange={setPublished}
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
                {isRemoving ? "Removing…" : "Remove Domain"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
