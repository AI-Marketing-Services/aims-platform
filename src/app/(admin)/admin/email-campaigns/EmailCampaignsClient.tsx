"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plug, Unplug, ChevronDown, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EBWorkspace {
  id: number
  name: string
}

interface UserRow {
  id: string
  name: string | null
  email: string
  company: string | null
  emailBisonConnection: {
    workspaceId: number
    workspaceName: string
  } | null
}

interface Props {
  users: UserRow[]
}

export function EmailCampaignsClient({ users }: Props) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<EBWorkspace[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, { id: number; name: string } | null>>(
    () =>
      Object.fromEntries(
        users.map((u) => [
          u.id,
          u.emailBisonConnection
            ? { id: u.emailBisonConnection.workspaceId, name: u.emailBisonConnection.workspaceName }
            : null,
        ])
      )
  )
  // Track connected status locally so it updates after save
  const [connected, setConnected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(users.map((u) => [u.id, !!u.emailBisonConnection]))
  )

  useEffect(() => {
    fetch("/api/admin/emailbison/workspaces")
      .then((r) => r.json())
      .then((d) => setWorkspaces(d.workspaces ?? []))
      .finally(() => setLoadingWorkspaces(false))
  }, [])

  async function handleAssign(userId: string) {
    const sel = selections[userId]
    setSaving(userId)
    setError(null)
    try {
      if (sel) {
        const res = await fetch("/api/admin/emailbison/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, workspaceId: sel.id, workspaceName: sel.name }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? "Failed to save connection")
          return
        }
        setConnected((prev) => ({ ...prev, [userId]: true }))
      } else {
        const res = await fetch(`/api/admin/emailbison/connections?userId=${userId}`, { method: "DELETE" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? "Failed to remove connection")
          return
        }
        setConnected((prev) => ({ ...prev, [userId]: false }))
      }
      setSaved(userId)
      setTimeout(() => setSaved(null), 2000)
      router.refresh()
    } catch {
      setError("Network error - please try again.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Bison Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const sel = selections[user.id]
              const isSaving = saving === user.id
              const isSaved = saved === user.id
              const isConnected = connected[user.id]
              return (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.name || "-"}</p>
                    {user.company && <p className="text-xs text-muted-foreground">{user.company}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {loadingWorkspaces ? (
                      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <div className="relative w-52">
                        <select
                          value={sel?.id ?? ""}
                          onChange={(e) => {
                            const ws = workspaces.find((w) => w.id === Number(e.target.value))
                            setSelections((prev) => ({
                              ...prev,
                              [user.id]: ws ? { id: ws.id, name: ws.name } : null,
                            }))
                          }}
                          className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                        >
                          <option value=""> -  No workspace  - </option>
                          {workspaces.map((ws) => (
                            <option key={ws.id} value={ws.id}>
                              {ws.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/15 border border-green-800 px-2.5 py-1 text-xs font-medium text-green-400">
                        <Plug className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <Unplug className="h-3 w-3" />
                        Not connected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAssign(user.id)}
                      disabled={isSaving}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        isSaved
                          ? "bg-green-900/15 text-green-400 border border-green-800"
                          : "bg-[#C4972A] text-white hover:bg-[#A17D22]"
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSaved ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : null}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No client accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
