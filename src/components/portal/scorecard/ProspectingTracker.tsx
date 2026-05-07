"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { TrackerRow } from "./types"

interface Props {
  rows: TrackerRow[]
  onUpdate: (id: string, fields: Partial<TrackerRow>) => Promise<void>
  onAdd: (companyName: string) => Promise<string | null>
}

const COLUMN_BASE_CLASSES =
  "px-2 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 bg-transparent border-0 focus:outline-none focus:bg-primary/5 transition-colors w-full"

const OUTREACH_OPTIONS = ["", "email", "linkedin", "sms", "call", "in-person"] as const
const STATUS_OPTIONS = [
  "",
  "drafted",
  "sent",
  "replied",
  "no-reply",
  "booked",
] as const

function toLocalDate(iso: string | null): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

function fromLocalDate(value: string): string | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function ProspectingTracker({ rows, onUpdate, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [newCompany, setNewCompany] = useState("")

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newCompany.trim()) return
    setAdding(true)
    try {
      const id = await onAdd(newCompany.trim())
      if (id) setNewCompany("")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Prospecting Activity Tracker
          </p>
          <p className="text-[11px] text-muted-foreground">
            Active book of work — every column is inline-editable. Pulled from
            your CRM, edited here.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {rows.length} active
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1500px]">
          <thead className="border-b border-border">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <Th>Date added</Th>
              <Th>Contact</Th>
              <Th>Business</Th>
              <Th>Role</Th>
              <Th>Source / Relationship</Th>
              <Th>Possible problem / hypothesis</Th>
              <Th>Outreach</Th>
              <Th>Status</Th>
              <Th>First message</Th>
              <Th>Follow-up 1</Th>
              <Th>Follow-up 2</Th>
              <Th>Discovery ask</Th>
              <Th>Next action</Th>
              <Th>Next due</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row key={r.id} row={r} onUpdate={onUpdate} />
            ))}
            <tr className="border-t border-border">
              <td colSpan={15} className="p-2">
                <form
                  onSubmit={handleAdd}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Add a new prospect — type a business name and hit enter"
                    className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-1.5"
                  />
                  <button
                    type="submit"
                    disabled={adding || !newCompany.trim()}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? "Adding…" : "Add"}
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  )
}

function Row({
  row,
  onUpdate,
}: {
  row: TrackerRow
  onUpdate: (id: string, fields: Partial<TrackerRow>) => Promise<void>
}) {
  function patchString(field: keyof TrackerRow, original: string | null) {
    return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value.trim()
      if (v === (original ?? "")) return
      onUpdate(row.id, { [field]: v.length === 0 ? null : v } as Partial<TrackerRow>)
    }
  }

  function patchSelect(field: keyof TrackerRow, original: string | null) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value
      if (v === (original ?? "")) return
      onUpdate(row.id, { [field]: v.length === 0 ? null : v } as Partial<TrackerRow>)
    }
  }

  function patchDate(field: keyof TrackerRow, original: string | null) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = fromLocalDate(e.target.value)
      if (next === original) return
      onUpdate(row.id, { [field]: next } as Partial<TrackerRow>)
    }
  }

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/10">
      <Td>
        <span className="text-[12px] text-muted-foreground tabular-nums whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.contactName ?? ""}
          onBlur={patchString("contactName", row.contactName)}
          placeholder="Name"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.companyName}
          onBlur={patchString("companyName", row.companyName)}
          placeholder="Business"
          className={`${COLUMN_BASE_CLASSES} font-medium`}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.contactRole ?? ""}
          onBlur={patchString("contactRole", row.contactRole)}
          placeholder="Role"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.relationship ?? ""}
          onBlur={patchString("relationship", row.relationship)}
          placeholder="Source / how you know them"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.possibleProblem ?? ""}
          onBlur={patchString("possibleProblem", row.possibleProblem)}
          placeholder="What pain might they have?"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <select
          value={row.outreachType ?? ""}
          onChange={patchSelect("outreachType", row.outreachType)}
          className={`${COLUMN_BASE_CLASSES} cursor-pointer`}
        >
          {OUTREACH_OPTIONS.map((o) => (
            <option key={o || "none"} value={o}>
              {o || "—"}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <select
          value={row.messageStatus ?? ""}
          onChange={patchSelect("messageStatus", row.messageStatus)}
          className={`${COLUMN_BASE_CLASSES} cursor-pointer`}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o || "none"} value={o}>
              {o || "—"}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <input
          type="date"
          defaultValue={toLocalDate(row.firstMessageAt)}
          onBlur={patchDate("firstMessageAt", row.firstMessageAt)}
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="date"
          defaultValue={toLocalDate(row.followUp1At)}
          onBlur={patchDate("followUp1At", row.followUp1At)}
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="date"
          defaultValue={toLocalDate(row.followUp2At)}
          onBlur={patchDate("followUp2At", row.followUp2At)}
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="date"
          defaultValue={toLocalDate(row.discoveryAskAt)}
          onBlur={patchDate("discoveryAskAt", row.discoveryAskAt)}
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.nextAction ?? ""}
          onBlur={patchString("nextAction", row.nextAction)}
          placeholder="Next move"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="date"
          defaultValue={toLocalDate(row.nextActionDueAt)}
          onBlur={patchDate("nextActionDueAt", row.nextActionDueAt)}
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
      <Td>
        <input
          type="text"
          defaultValue={row.notes ?? ""}
          onBlur={patchString("notes", row.notes)}
          placeholder="Notes"
          className={COLUMN_BASE_CLASSES}
        />
      </Td>
    </tr>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-r border-border/40 last:border-0">{children}</td>
}
