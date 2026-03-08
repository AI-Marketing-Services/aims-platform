"use client"

import { useState, useTransition, useRef } from "react"
import {
  ChevronDown,
  Clock,
  Send,
  FileText,
  StickyNote,
  Mail,
  Phone,
  Star,
  MessageSquare,
  Globe,
  ExternalLink,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityType =
  | "EMAIL_SENT"
  | "CALL_MADE"
  | "DEMO_COMPLETED"
  | "STAGE_CHANGE"
  | "NOTE_ADDED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "TASK_CREATED"
  | "FORM_SUBMITTED"

interface Activity {
  id: string
  type: ActivityType
  detail: string
  authorId: string | null
  createdAt: string
}

interface Note {
  id: string
  content: string
  authorId: string
  createdAt: string
}

interface ServiceArmEntry {
  id: string
  name: string
  monthlyPrice?: number | null
  status: string
}

interface Props {
  dealId: string
  currentStage: string
  stageLabel: string
  stageColor: string
  stageOptions: { value: string; label: string }[]
  activities: Activity[]
  notes: Note[]
  authorId: string
  // Contact fields
  contactName: string
  company?: string | null
  contactEmail?: string | null
  phone?: string | null
  website?: string | null
  industry?: string | null
  closeLeadId?: string | null
  // Score / priority / assignment
  leadScore?: number | null
  priority?: string | null
  assignedTo?: string | null
  // Service arms
  serviceArms?: ServiceArmEntry[]
  // Attribution
  source?: string | null
  sourceDetail?: string | null
  channelTag?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  createdAt?: string
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  EMAIL_SENT: <Mail className="w-3.5 h-3.5" />,
  CALL_MADE: <Phone className="w-3.5 h-3.5" />,
  DEMO_COMPLETED: <Star className="w-3.5 h-3.5" />,
  STAGE_CHANGE: <Star className="w-3.5 h-3.5" />,
  NOTE_ADDED: <MessageSquare className="w-3.5 h-3.5" />,
  SUBSCRIPTION_CREATED: <Check className="w-3.5 h-3.5" />,
  SUBSCRIPTION_CANCELLED: <X className="w-3.5 h-3.5" />,
  PAYMENT_RECEIVED: <FileText className="w-3.5 h-3.5" />,
  TASK_CREATED: <StickyNote className="w-3.5 h-3.5" />,
  FORM_SUBMITTED: <MessageSquare className="w-3.5 h-3.5" />,
}

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"]

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function leadScoreColor(score: number | null | undefined): string {
  if (score == null) return "text-gray-500"
  if (score >= 70) return "text-red-400"
  if (score >= 40) return "text-amber-400"
  return "text-gray-400"
}

/** Inline-editable text field */
function InlineField({
  label,
  value,
  onSave,
  type = "text",
  href,
}: {
  label: string
  value: string | null | undefined
  onSave: (v: string) => Promise<void>
  type?: string
  href?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value ?? "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commit() {
    setEditing(false)
    if (draft !== (value ?? "")) {
      await onSave(draft)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") setEditing(false)
          }}
          className="flex-1 bg-muted border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-[#DC2626]"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm text-blue-400 hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="flex-1 text-sm text-foreground truncate">{value}</span>
        )
      ) : (
        <span className="flex-1 text-sm text-muted-foreground/50 italic">—</span>
      )}
      <button
        onClick={startEdit}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-all"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

export function DealDetailClient({
  dealId,
  currentStage,
  stageLabel,
  stageOptions,
  activities: initialActivities,
  notes: initialNotes,
  authorId,
  contactName: initialContactName,
  company: initialCompany,
  contactEmail: initialEmail,
  phone: initialPhone,
  website: initialWebsite,
  industry: initialIndustry,
  closeLeadId,
  leadScore: initialLeadScore,
  priority: initialPriority,
  assignedTo: initialAssignedTo,
  serviceArms = [],
  source,
  sourceDetail,
  channelTag,
  utmSource,
  utmMedium,
  utmCampaign,
  createdAt,
}: Props) {
  const [stage, setStage] = useState(currentStage)
  const [stageDropdown, setStageDropdown] = useState(false)
  const [activities, setActivities] = useState(initialActivities)
  const [notes, setNotes] = useState(initialNotes)
  const [noteText, setNoteText] = useState("")
  const [activeTab, setActiveTab] = useState<"activity" | "notes" | "emails">("activity")
  const [isPending, startTransition] = useTransition()

  // Contact fields
  const [contactName, setContactName] = useState(initialContactName)
  const [company, setCompany] = useState(initialCompany ?? "")
  const [email, setEmail] = useState(initialEmail ?? "")
  const [phone, setPhone] = useState(initialPhone ?? "")
  const [website, setWebsite] = useState(initialWebsite ?? "")
  const [industry, setIndustry] = useState(initialIndustry ?? "")

  // Score / priority / assignment
  const [leadScore] = useState(initialLeadScore)
  const [priority, setPriority] = useState(initialPriority ?? "MEDIUM")
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo ?? "")

  // Quick actions
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [lostReason, setLostReason] = useState("")
  const [lostPrompt, setLostPrompt] = useState(false)

  async function patchDeal(data: Record<string, string | number | null>) {
    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, authorId }),
    }).catch(console.error)
  }

  function handleStageChange(newStage: string) {
    const prev = stage
    setStage(newStage)
    setStageDropdown(false)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage, authorId }),
        })
        if (!res.ok) {
          setStage(prev)
        } else {
          const label = stageOptions.find((s) => s.value === newStage)?.label ?? newStage
          setActivities((prev) => [
            {
              id: crypto.randomUUID(),
              type: "STAGE_CHANGE",
              detail: `Moved to ${label}`,
              authorId,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
        }
      } catch {
        setStage(prev)
      }
    })
  }

  async function handleAddNote() {
    const content = noteText.trim()
    if (!content) return
    setNoteText("")

    try {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorId }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [
          { id: data.id, content, authorId, createdAt: new Date().toISOString() },
          ...prev,
        ])
        setActivities((prev) => [
          {
            id: crypto.randomUUID(),
            type: "NOTE_ADDED",
            detail: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
            authorId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    } catch {
      setNoteText(content)
    }
  }

  async function handleMarkWon() {
    handleStageChange("ACTIVE_CLIENT")
  }

  async function handleMarkLost() {
    if (!lostReason.trim()) return
    setLostPrompt(false)
    setLostReason("")
    const prev = stage
    setStage("LOST")
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "LOST", lostReason: lostReason.trim(), authorId }),
      })
      if (!res.ok) setStage(prev)
    } catch {
      setStage(prev)
    }
  }

  async function handleCreateTask() {
    const title = taskTitle.trim()
    if (!title) return
    setTaskTitle("")
    setTaskFormOpen(false)
    await fetch(`/api/deals/${dealId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, authorId }),
    }).catch(console.error)
    setActivities((prev) => [
      {
        id: crypto.randomUUID(),
        type: "TASK_CREATED",
        detail: title,
        authorId,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const currentLabel = stageOptions.find((s) => s.value === stage)?.label ?? stageLabel

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── LEFT COLUMN (60%) ── */}
      <div className="lg:col-span-3 space-y-4">

        {/* Contact card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{contactName}</h2>
              {company && <p className="text-sm text-muted-foreground mt-0.5">{company}</p>}
            </div>
            {closeLeadId && (
              <a
                href={`https://app.close.com/lead/${closeLeadId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View in Close
              </a>
            )}
          </div>

          <div className="space-y-2">
            <InlineField
              label="Name"
              value={contactName}
              onSave={async (v) => { setContactName(v); await patchDeal({ contactName: v }) }}
            />
            <InlineField
              label="Company"
              value={company}
              onSave={async (v) => { setCompany(v); await patchDeal({ company: v }) }}
            />
            <InlineField
              label="Email"
              value={email}
              type="email"
              href={email ? `mailto:${email}` : undefined}
              onSave={async (v) => { setEmail(v); await patchDeal({ contactEmail: v }) }}
            />
            <InlineField
              label="Phone"
              value={phone}
              type="tel"
              href={phone ? `tel:${phone}` : undefined}
              onSave={async (v) => { setPhone(v); await patchDeal({ phone: v }) }}
            />
            <InlineField
              label="Website"
              value={website}
              href={website ? (website.startsWith("http") ? website : `https://${website}`) : undefined}
              onSave={async (v) => { setWebsite(v); await patchDeal({ website: v }) }}
            />
            <InlineField
              label="Industry"
              value={industry}
              onSave={async (v) => { setIndustry(v); await patchDeal({ industry: v }) }}
            />
          </div>
        </div>

        {/* Score & Priority */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Score & Priority</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lead Score</p>
              <p className={cn("text-2xl font-bold font-mono", leadScoreColor(leadScore))}>
                {leadScore ?? "—"}
                {leadScore != null && <span className="text-sm font-normal text-muted-foreground">/100</span>}
              </p>
              {leadScore != null && (
                <p className={cn("text-xs mt-0.5", leadScoreColor(leadScore))}>
                  {leadScore >= 70 ? "Hot" : leadScore >= 40 ? "Warm" : "Cold"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <select
                  value={priority}
                  onChange={async (e) => {
                    setPriority(e.target.value)
                    await patchDeal({ priority: e.target.value })
                  }}
                  className="w-full bg-muted border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-[#DC2626]"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Stage</p>
                <div className="relative">
                  <button
                    onClick={() => setStageDropdown(!stageDropdown)}
                    className="flex items-center gap-1.5 w-full px-2 py-1 rounded border border-border bg-muted text-sm text-foreground hover:border-[#DC2626]/50 transition-colors"
                  >
                    <span className="flex-1 text-left truncate">{currentLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                  </button>
                  {stageDropdown && (
                    <div className="absolute left-0 top-full mt-1 z-10 w-52 rounded-xl border border-border bg-card shadow-xl py-1">
                      {stageOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStageChange(opt.value)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors",
                            opt.value === stage
                              ? "text-foreground bg-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <InlineField
              label="Assigned"
              value={assignedTo}
              onSave={async (v) => { setAssignedTo(v); await patchDeal({ assignedTo: v }) }}
            />
          </div>
          {isPending && <p className="text-xs text-muted-foreground mt-2">Saving…</p>}
        </div>

        {/* Service Arms */}
        {serviceArms.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Service Arms</p>
            <div className="space-y-2">
              {serviceArms.map((sa) => (
                <div
                  key={sa.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground">{sa.name}</span>
                  <div className="flex items-center gap-2">
                    {sa.monthlyPrice != null && (
                      <span className="text-xs font-mono text-muted-foreground">
                        ${sa.monthlyPrice.toLocaleString()}/mo
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded border",
                        sa.status === "active"
                          ? "text-green-400 bg-green-500/10 border-green-500/20"
                          : "text-gray-400 bg-white/5 border-white/10"
                      )}
                    >
                      {sa.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Service
            </button>
          </div>
        )}

        {/* Attribution */}
        {(source || channelTag || utmSource || utmMedium || utmCampaign || createdAt) && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Attribution</p>
            <div className="space-y-1.5 text-xs">
              {source && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                    {source}
                  </span>
                </div>
              )}
              {sourceDetail && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Detail</span>
                  <span className="text-foreground">{sourceDetail}</span>
                </div>
              )}
              {channelTag && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="text-foreground">{channelTag}</span>
                </div>
              )}
              {utmSource && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">UTM Source</span>
                  <span className="text-foreground">{utmSource}</span>
                </div>
              )}
              {utmMedium && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">UTM Medium</span>
                  <span className="text-foreground">{utmMedium}</span>
                </div>
              )}
              {utmCampaign && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">UTM Campaign</span>
                  <span className="text-foreground">{utmCampaign}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">
                    {new Date(createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN (40%) ── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Quick Actions bar */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </a>
            )}
            <button
              onClick={() => setTaskFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5" />
              Create Task
            </button>
            {stage !== "ACTIVE_CLIENT" && (
              <button
                onClick={handleMarkWon}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 text-xs text-green-400 hover:bg-green-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Won
              </button>
            )}
            {stage !== "LOST" && (
              <button
                onClick={() => setLostPrompt(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Mark Lost
              </button>
            )}
          </div>

          {/* Task form */}
          {taskFormOpen && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title..."
                onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                className="flex-1 bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#DC2626]"
              />
              <button
                onClick={handleCreateTask}
                className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setTaskFormOpen(false); setTaskTitle("") }}
                className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Lost reason form */}
          {lostPrompt && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Reason for loss..."
                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#DC2626]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleMarkLost}
                  disabled={!lostReason.trim()}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Confirm Lost
                </button>
                <button
                  onClick={() => { setLostPrompt(false); setLostReason("") }}
                  className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity / Notes / Emails tabs */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border">
            {(["activity", "notes", "emails"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors capitalize",
                  activeTab === tab
                    ? "text-foreground border-b-2 border-[#DC2626]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "activity" && <Clock className="h-3.5 w-3.5" />}
                {tab === "notes" && <StickyNote className="h-3.5 w-3.5" />}
                {tab === "emails" && <Mail className="h-3.5 w-3.5" />}
                {tab === "activity" ? `Activity (${activities.length})` : tab === "notes" ? `Notes (${notes.length})` : "Emails"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Activity tab */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
                )}
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground flex-shrink-0">
                      {ACTIVITY_ICONS[act.type] ?? <Globe className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-foreground font-medium capitalize">
                          {act.type.replace(/_/g, " ").toLowerCase()}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {timeAgo(act.createdAt)}
                        </span>
                      </div>
                      {act.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{act.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes tab */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote()
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">⌘+Enter to save</span>
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Save Note
                    </button>
                  </div>
                </div>
                {notes.length === 0 && (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  </div>
                )}
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-muted/50 border border-border p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{timeAgo(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Emails tab */}
            {activeTab === "emails" && (
              <div className="flex flex-col items-center py-10 gap-3">
                <Mail className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Email history coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
