"use client"

import { useState } from "react"

interface PortalAccess {
  id: string
  guestEmail: string
  guestName: string | null
  expiresAt: string
  lastAccessAt: string | null
  revokedAt: string | null
  createdAt: string
}

interface ClientPortalSectionProps {
  dealId: string
  initialAccess: PortalAccess[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function isActive(access: PortalAccess): boolean {
  return !access.revokedAt && new Date(access.expiresAt) > new Date()
}

export function ClientPortalSection({ dealId, initialAccess }: ClientPortalSectionProps) {
  const [accessList, setAccessList] = useState<PortalAccess[]>(initialAccess)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeAccess = accessList.find(isActive)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/portal/deals/${dealId}/invite-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      })

      const json = (await res.json()) as { ok?: boolean; token?: string; error?: string }

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to send invite")
        return
      }

      const appUrl = window.location.origin
      const link = `${appUrl}/client-portal/${json.token}`
      setMagicLink(link)

      // Refresh access list by re-fetching
      const refreshRes = await fetch(`/api/portal/deals/${dealId}/accesses`)
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { accesses: PortalAccess[] }
        setAccessList(data.accesses)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(accessId: string) {
    setRevoking(accessId)
    setError(null)

    try {
      const res = await fetch(`/api/portal/deals/${dealId}/revoke-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId }),
      })

      const json = (await res.json()) as { ok?: boolean; error?: string }

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to revoke access")
        return
      }

      setAccessList((prev) =>
        prev.map((a) =>
          a.id === accessId ? { ...a, revokedAt: new Date().toISOString() } : a
        )
      )
      setMagicLink(null)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setRevoking(null)
    }
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea")
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleModalClose() {
    setShowModal(false)
    setEmail("")
    setName("")
    setMagicLink(null)
    setError(null)
  }

  return (
    <div
      className="rounded-lg border p-5"
      style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#F0EBE0" }}>
            Client Portal
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Share a branded project view with your client
          </p>
        </div>

        {activeAccess ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-900 text-emerald-200">
            Active
          </span>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-700 text-gray-300">
            Inactive
          </span>
        )}
      </div>

      {/* Active access details */}
      {activeAccess && (
        <div
          className="rounded-md border p-4 mb-4 space-y-2"
          style={{ background: "#0D1117", borderColor: "rgba(240,235,224,0.06)" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Shared with</span>
            <span className="text-xs font-medium" style={{ color: "#F0EBE0" }}>
              {activeAccess.guestName ? `${activeAccess.guestName} (${activeAccess.guestEmail})` : activeAccess.guestEmail}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: "#9CA3AF" }}>
            <span>Expires {formatDate(activeAccess.expiresAt)}</span>
            <span>Last viewed {formatDate(activeAccess.lastAccessAt)}</span>
          </div>

          {/* Copy link (available only in current session) + Revoke buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {magicLink && (
              <button
                onClick={() => void handleCopy(magicLink)}
                className="text-xs font-medium px-3 py-1.5 rounded-md border transition-opacity hover:opacity-80"
                style={{ borderColor: "#C4972A", color: "#C4972A" }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            )}
            <button
              onClick={() => void handleRevoke(activeAccess.id)}
              disabled={revoking === activeAccess.id}
              className="text-xs font-medium px-3 py-1.5 rounded-md border transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "rgba(239,68,68,0.4)", color: "#F87171" }}
            >
              {revoking === activeAccess.id ? "Revoking..." : "Revoke Access"}
            </button>
          </div>
        </div>
      )}

      {/* New magic link shown after invite */}
      {magicLink && (
        <div
          className="rounded-md border p-3 mb-4"
          style={{ background: "#0D1117", borderColor: "rgba(196,151,42,0.3)" }}
        >
          <p className="text-xs font-medium mb-1.5" style={{ color: "#C4972A" }}>
            Magic link generated — copy it to share:
          </p>
          <div className="flex items-center gap-2">
            <code
              className="text-xs flex-1 truncate rounded px-2 py-1"
              style={{ background: "#08090D", color: "#9CA3AF" }}
            >
              {magicLink}
            </code>
            <button
              onClick={() => void handleCopy(magicLink)}
              className="text-xs font-medium px-3 py-1.5 rounded-md shrink-0 transition-opacity hover:opacity-80"
              style={{ background: "#C4972A", color: "#08090D" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-md bg-red-900/40 text-red-300 border border-red-800/50">
          {error}
        </p>
      )}

      {/* Invite button */}
      <button
        onClick={() => setShowModal(true)}
        className="text-sm font-medium px-4 py-2 rounded-md transition-opacity hover:opacity-80"
        style={{ background: "#C4972A", color: "#08090D" }}
      >
        {activeAccess ? "Re-invite Client" : "Invite Client"}
      </button>

      {/* Invite modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(8,9,13,0.85)" }}
        >
          <div
            className="w-full max-w-md rounded-lg border p-6"
            style={{ background: "#141923", borderColor: "rgba(240,235,224,0.1)" }}
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: "#F0EBE0" }}>
              Invite Client to Portal
            </h2>
            <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>
              A magic link will be emailed to the client and returned here for copying.
              Any existing active access for this email will be revoked.
            </p>

            {magicLink ? (
              <div className="space-y-4">
                <div
                  className="rounded-md border p-3"
                  style={{ background: "#0D1117", borderColor: "rgba(196,151,42,0.3)" }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: "#C4972A" }}>
                    Invite sent! Copy the magic link:
                  </p>
                  <code className="text-xs block break-all" style={{ color: "#9CA3AF" }}>
                    {magicLink}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleCopy(magicLink)}
                    className="flex-1 text-sm font-medium py-2 rounded-md transition-opacity hover:opacity-80"
                    style={{ background: "#C4972A", color: "#08090D" }}
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={handleModalClose}
                    className="flex-1 text-sm font-medium py-2 rounded-md border transition-opacity hover:opacity-80"
                    style={{ borderColor: "rgba(240,235,224,0.1)", color: "#9CA3AF" }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void handleInvite(e)} className="space-y-4">
                <div>
                  <label
                    htmlFor="portal-email"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "#9CA3AF" }}
                  >
                    Client Email *
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1"
                    style={{
                      background: "#0D1117",
                      borderColor: "rgba(240,235,224,0.1)",
                      color: "#F0EBE0",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="portal-name"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "#9CA3AF" }}
                  >
                    Client Name (optional)
                  </label>
                  <input
                    id="portal-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1"
                    style={{
                      background: "#0D1117",
                      borderColor: "rgba(240,235,224,0.1)",
                      color: "#F0EBE0",
                    }}
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-md bg-red-900/40 text-red-300 border border-red-800/50">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-sm font-medium py-2 rounded-md transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "#C4972A", color: "#08090D" }}
                  >
                    {loading ? "Sending..." : "Send Invite"}
                  </button>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={loading}
                    className="flex-1 text-sm font-medium py-2 rounded-md border transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: "rgba(240,235,224,0.1)", color: "#9CA3AF" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
