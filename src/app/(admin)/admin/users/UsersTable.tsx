"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, ShieldCheck, Trash2, UserMinus, UserPlus } from "lucide-react"

type ClerkUserRow = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  role: string
  lastActiveAt: number | null
  createdAt: number | null
}

const ROLES = ["ADMIN", "SUPER_ADMIN", "INTERN", "RESELLER", "CLIENT"] as const

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ClerkUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" })
        if (!res.ok) {
          toast.error("Couldn't load users")
          return
        }
        const body = (await res.json()) as { users: ClerkUserRow[] }
        if (!cancelled) setUsers(body.users)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Permanently delete ${email} from Clerk? This cannot be undone.`)) return
    setBusy(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Delete failed")
        return
      }
      toast.success(`${email} removed`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(null)
    }
  }

  async function changeRole(userId: string, role: string) {
    setBusy(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Role update failed")
        return
      }
      toast.success(`Role updated to ${role}`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading team...
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
        <p className="text-sm text-muted-foreground">No users yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-muted/40 border-b border-border">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId
            const isAdmin = u.role === "ADMIN" || u.role === "SUPER_ADMIN"
            const displayName =
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              u.email ||
              u.id

            return (
              <tr
                key={u.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.imageUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                        {(u.firstName ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {displayName}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            you
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted/50 text-muted-foreground border border-border"
                    }`}
                  >
                    {isAdmin && <ShieldCheck className="h-3 w-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {!isSelf && (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={busy === u.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:border-primary/40 focus:outline-none focus:border-primary/40 disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                    {!isSelf && !isAdmin && (
                      <button
                        onClick={() => changeRole(u.id, "ADMIN")}
                        disabled={busy === u.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        <UserPlus className="h-3 w-3" />
                        Make admin
                      </button>
                    )}
                    {!isSelf && isAdmin && (
                      <button
                        onClick={() => changeRole(u.id, "CLIENT")}
                        disabled={busy === u.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50"
                      >
                        <UserMinus className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                    {!isSelf && (
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        disabled={busy === u.id}
                        title="Delete from Clerk"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                    {busy === u.id && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
