"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Plus,
  Trash2,
  Star,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Contact {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
  title: string | null
  isPrimary: boolean
  notes: string | null
}

interface ContactsManagerProps {
  dealId: string
  initialContacts: Contact[]
}

export function ContactsManager({ dealId, initialContacts }: ContactsManagerProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setAdding(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      firstName: (form.get("firstName") as string).trim(),
      lastName: (form.get("lastName") as string).trim() || undefined,
      email: (form.get("email") as string).trim() || undefined,
      phone: (form.get("phone") as string).trim() || undefined,
      title: (form.get("title") as string).trim() || undefined,
      isPrimary: form.get("isPrimary") === "on",
    }
    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to add contact")
        return
      }
      setContacts((c) => [data.contact, ...c])
      setShowAdd(false)
      ;(e.target as HTMLFormElement).reset()
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(contactId: string) {
    if (confirmDelete !== contactId) {
      setConfirmDelete(contactId)
      setTimeout(() => setConfirmDelete(null), 3000)
      return
    }
    try {
      await fetch(
        `/api/portal/crm/deals/${dealId}/contacts?contactId=${contactId}`,
        { method: "DELETE" },
      )
      setContacts((c) => c.filter((x) => x.id !== contactId))
      setConfirmDelete(null)
      startTransition(() => router.refresh())
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Contacts ({contacts.length})
        </p>
        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v)
            setError(null)
          }}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showAdd ? (
            <>
              <X className="h-3 w-3" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              Add contact
            </>
          )}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-border bg-background p-3 space-y-2.5"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              name="firstName"
              required
              placeholder="First name *"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              name="lastName"
              placeholder="Last name"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <input
            name="title"
            placeholder="Title (CEO, VP Sales, etc.)"
            className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="email"
              type="email"
              placeholder="email@company.com"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              className="px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" name="isPrimary" />
            Mark as primary contact
          </label>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              disabled={adding}
              className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {adding ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Adding…
                </>
              ) : (
                "Save contact"
              )}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No contacts yet. Add one manually or run Enrich to auto-populate.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {contacts.map((c) => {
            const fullName = `${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}`
            const confirming = confirmDelete === c.id
            return (
              <li key={c.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {fullName}
                    </p>
                    {c.isPrimary && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>
                  {c.title && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="h-3 w-3" />
                      {c.title}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className={cn(
                    "p-1 rounded transition-colors shrink-0",
                    confirming
                      ? "text-red-400 bg-red-400/10"
                      : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10",
                  )}
                  title={confirming ? "Click again to confirm delete" : "Delete contact"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
