"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
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
  DollarSign,
  Calendar,
  TrendingUp,
  Tag,
  Trash2,
  AlertTriangle,
  CreditCard,
  ClipboardList,
} from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

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
  tier?: string | null
  monthlyPrice?: number | null
  status: string
  activatedAt?: string | null
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
  contactName: string
  company?: string | null
  contactEmail?: string | null
  phone?: string | null
  website?: string | null
  industry?: string | null
  closeLeadId?: string | null
  leadScore?: number | null
  leadScoreTier?: string | null
  priority?: string | null
  assignedTo?: string | null
  serviceArms?: ServiceArmEntry[]
  value?: number
  mrr?: number
  daysInPipeline?: number
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
  STAGE_CHANGE: <TrendingUp className="w-3.5 h-3.5" />,
  NOTE_ADDED: <MessageSquare className="w-3.5 h-3.5" />,
  SUBSCRIPTION_CREATED: <Check className="w-3.5 h-3.5" />,
  SUBSCRIPTION_CANCELLED: <X className="w-3.5 h-3.5" />,
  PAYMENT_RECEIVED: <CreditCard className="w-3.5 h-3.5" />,
  TASK_CREATED: <ClipboardList className="w-3.5 h-3.5" />,
  FORM_SUBMITTED: <FileText className="w-3.5 h-3.5" />,
}

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "EMAIL_SENT", label: "Email Sent" },
  { value: "CALL_MADE", label: "Call Made" },
  { value: "DEMO_COMPLETED", label: "Demo Completed" },
  { value: "NOTE_ADDED", label: "Note Added" },
  { value: "TASK_CREATED", label: "Task Created" },
  { value: "FORM_SUBMITTED", label: "Form Submitted" },
]

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-muted-foreground bg-deep",
  MEDIUM: "text-blue-400 bg-blue-900/20",
  HIGH: "text-orange-400 bg-orange-900/20",
  URGENT: "text-primary bg-primary/10",
}


function leadScoreBadge(score: number | null | undefined, tier: string | null | undefined) {
  if (score == null) return null
  const label = tier ?? (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold")
  const colors =
    label === "hot"
      ? "text-primary bg-primary/10 border-primary/30"
      : label === "warm"
        ? "text-amber-400 bg-amber-900/20 border-amber-800"
        : "text-muted-foreground bg-deep border-border"
  return { label, colors }
}

function InlineField({
  label,
  value,
  editing,
  onSave,
  type = "text",
  href,
}: {
  label: string
  value: string | null | undefined
  editing: boolean
  onSave: (v: string) => Promise<void>
  type?: string
  href?: string
}) {
  const [draft, setDraft] = useState(value ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  async function commit() {
    if (draft !== (value ?? "")) {
      await onSave(draft)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") setDraft(value ?? "")
          }}
          autoFocus
          className="flex-1 bg-card border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-[#C4972A] focus:ring-1 focus:ring-[#C4972A]/20"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
      {value ? (
        href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex-1 text-sm text-blue-400 hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="flex-1 text-sm text-foreground truncate">{value}</span>
        )
      ) : (
        <span className="flex-1 text-sm text-muted-foreground italic">--</span>
      )}
    </div>
  )
}

export function DealDetailClient({
  dealId,
  currentStage,
  stageLabel,
  stageColor,
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
  leadScoreTier,
  priority: initialPriority,
  assignedTo: initialAssignedTo,
  serviceArms = [],
  value = 0,
  mrr = 0,
  daysInPipeline = 0,
  source,
  sourceDetail,
  channelTag,
  utmSource,
  utmMedium,
  utmCampaign,
  createdAt,
}: Props) {
  const router = useRouter()
  const [stage, setStage] = useState(currentStage)
  const [stageDropdown, setStageDropdown] = useState(false)
  const [activities, setActivities] = useState(initialActivities)
  const [notes, setNotes] = useState(initialNotes)
  const [noteText, setNoteText] = useState("")
  const [isPending, startTransition] = useTransition()

  // Contact fields
  const [contactName, setContactName] = useState(initialContactName)
  const [company, setCompany] = useState(initialCompany ?? "")
  const [email, setEmail] = useState(initialEmail ?? "")
  const [phone, setPhone] = useState(initialPhone ?? "")
  const [website, setWebsite] = useState(initialWebsite ?? "")
  const [industry, setIndustry] = useState(initialIndustry ?? "")
  const [isEditingContact, setIsEditingContact] = useState(false)

  // Score / priority / assignment
  const [leadScore] = useState(initialLeadScore)
  const [priority, setPriority] = useState(initialPriority ?? "MEDIUM")
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo ?? "")

  // Activity form
  const [addActivityOpen, setAddActivityOpen] = useState(false)
  const [newActivityType, setNewActivityType] = useState<ActivityType>("EMAIL_SENT")
  const [newActivityDetail, setNewActivityDetail] = useState("")

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  async function patchDeal(data: Record<string, string | number | null>) {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, authorId }),
      })
      if (!res.ok) console.error("patchDeal failed:", res.status)
    } catch (err) {
      console.error("patchDeal error:", err)
    }
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
            detail: content.slice(0, 80) + (content.length > 80 ? "..." : ""),
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

  async function handleAddActivity() {
    const detail = newActivityDetail.trim()
    if (!detail) return
    setNewActivityDetail("")
    setAddActivityOpen(false)

    try {
      const res = await fetch(`/api/deals/${dealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newActivityType, detail, authorId }),
      })
      if (res.ok) {
        const data = await res.json()
        setActivities((prev) => [
          {
            id: data.id ?? crypto.randomUUID(),
            type: newActivityType,
            detail,
            authorId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    } catch {
      setNewActivityDetail(detail)
      setAddActivityOpen(true)
    }
  }

  async function handleDeleteDeal() {
    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/admin/crm")
      }
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const currentLabel = stageOptions.find((s) => s.value === stage)?.label ?? stageLabel
  const currentStageColor =
    stage === currentStage
      ? stageColor
      : {
          NEW_LEAD: "text-muted-foreground bg-deep border-border",
          QUALIFIED: "text-blue-400 bg-blue-900/20 border-blue-800",
          DEMO_BOOKED: "text-purple-400 bg-purple-900/20 border-purple-800",
          PROPOSAL_SENT: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
          NEGOTIATION: "text-orange-400 bg-orange-900/20 border-orange-800",
          ACTIVE_CLIENT: "text-green-400 bg-green-900/20 border-green-800",
          UPSELL_OPPORTUNITY: "text-emerald-400 bg-emerald-900/20 border-emerald-800",
          AT_RISK: "text-primary bg-primary/10 border-primary/30",
          CHURNED: "text-muted-foreground bg-deep border-border",
          LOST: "text-muted-foreground bg-deep border-border",
        }[stage] ?? stageColor

  const scoreBadge = leadScoreBadge(leadScore, leadScoreTier)

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C4972A]/10 text-[#C4972A] font-bold text-lg flex-shrink-0">
              {contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{contactName}</h1>
              {company && <p className="text-sm text-muted-foreground mt-0.5">{company}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {email && (
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Mail className="w-3 h-3" /> {email}
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Phone className="w-3 h-3" /> {phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", currentStageColor)}>
              {currentLabel}
            </span>
            {scoreBadge && (
              <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", scoreBadge.colors)}>
                {leadScore}/100 {scoreBadge.label}
              </span>
            )}
            <button
              onClick={() => setIsEditingContact(!isEditingContact)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                isEditingContact
                  ? "border-[#C4972A] text-[#C4972A] bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              {isEditingContact ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
              {isEditingContact ? "Done" : "Edit"}
            </button>
            {closeLeadId && (
              <a
                href={`https://app.close.com/lead/${closeLeadId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Close
              </a>
            )}
          </div>
        </div>

        {/* Editable contact fields */}
        {isEditingContact && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InlineField label="Name" value={contactName} editing onSave={async (v) => { setContactName(v); await patchDeal({ contactName: v }) }} />
            <InlineField label="Company" value={company} editing onSave={async (v) => { setCompany(v); await patchDeal({ company: v }) }} />
            <InlineField label="Email" value={email} editing type="email" onSave={async (v) => { setEmail(v); await patchDeal({ contactEmail: v }) }} />
            <InlineField label="Phone" value={phone} editing type="tel" onSave={async (v) => { setPhone(v); await patchDeal({ phone: v }) }} />
            <InlineField label="Website" value={website} editing onSave={async (v) => { setWebsite(v); await patchDeal({ website: v }) }} />
            <InlineField label="Industry" value={industry} editing onSave={async (v) => { setIndustry(v); await patchDeal({ industry: v }) }} />
          </div>
        )}
      </div>

      {/* ── KEY METRICS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Deal Value", value: `$${value.toLocaleString()}`, icon: DollarSign },
          { label: "MRR", value: `$${mrr.toLocaleString()}/mo`, icon: TrendingUp },
          { label: "Days in Pipeline", value: daysInPipeline.toString(), icon: Calendar },
          { label: "Source / Channel", value: channelTag ?? source ?? "--", icon: Tag },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT COLUMN (60%) ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Service Arms Section */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Service Arms</h2>
              <button className="flex items-center gap-1.5 text-xs text-[#C4972A] hover:text-[#A17D22] font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Add Service
              </button>
            </div>
            {serviceArms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No service arms attached</p>
            ) : (
              <div className="space-y-2">
                {serviceArms.map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-deep border border-border px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">{sa.name}</span>
                      {sa.tier && <span className="ml-2 text-xs text-muted-foreground">({sa.tier})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {sa.monthlyPrice != null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          ${sa.monthlyPrice.toLocaleString()}/mo
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded border font-medium",
                          sa.status === "active"
                            ? "text-green-400 bg-green-900/20 border-green-800"
                            : "text-muted-foreground bg-deep border-border"
                        )}
                      >
                        {sa.status}
                      </span>
                      {sa.activatedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(sa.activatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Activity Timeline ({activities.length})
              </h2>
              <button
                onClick={() => setAddActivityOpen(!addActivityOpen)}
                className="flex items-center gap-1.5 text-xs text-[#C4972A] hover:text-[#A17D22] font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Activity
              </button>
            </div>

            {addActivityOpen && (
              <div className="mb-4 p-3 bg-deep border border-border rounded-lg space-y-2">
                <select
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value as ActivityType)}
                  className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#C4972A]"
                >
                  {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newActivityDetail}
                  onChange={(e) => setNewActivityDetail(e.target.value)}
                  placeholder="Activity detail..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                  className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddActivity}
                    disabled={!newActivityDetail.trim()}
                    className="px-3 py-1.5 bg-[#C4972A] text-white text-xs font-medium rounded-lg hover:bg-[#A17D22] disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddActivityOpen(false); setNewActivityDetail("") }}
                    className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-deep text-muted-foreground flex-shrink-0 mt-0.5">
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
          </div>

          {/* Notes Section */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              Notes ({notes.length})
            </h2>

            <div className="space-y-3 mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2.5 bg-deep border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote()
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cmd+Enter to save</span>
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#C4972A] text-white text-sm font-medium rounded-lg hover:bg-[#A17D22] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  Save Note
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-deep border border-border p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{timeAgo(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Actions</h2>

            {/* Stage */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Stage</label>
              <div className="relative">
                <button
                  onClick={() => setStageDropdown(!stageDropdown)}
                  className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex-1 text-left truncate">{currentLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </button>
                {stageDropdown && (
                  <div className="absolute left-0 top-full mt-1 z-20 w-full rounded-xl border border-border bg-card shadow-lg py-1 max-h-64 overflow-y-auto">
                    {stageOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStageChange(opt.value)}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm transition-colors",
                          opt.value === stage
                            ? "text-foreground bg-deep font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={async (e) => {
                  setPriority(e.target.value)
                  await patchDeal({ priority: e.target.value })
                }}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#C4972A]"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                onBlur={async () => await patchDeal({ assignedTo: assignedTo || null })}
                placeholder="Enter assignee..."
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A]"
              />
            </div>

            {isPending && <p className="text-xs text-muted-foreground mb-2">Saving...</p>}

            {/* Delete */}
            <div className="pt-3 border-t border-border">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Deal
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-primary">Are you sure?</span>
                  <button
                    onClick={handleDeleteDeal}
                    className="px-2 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2 py-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Score & Priority Card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Lead Score</h2>
            <div className="text-center py-2">
              <p className={cn(
                "text-4xl font-bold font-mono",
                leadScore == null ? "text-muted-foreground" : leadScore >= 70 ? "text-primary" : leadScore >= 40 ? "text-amber-400" : "text-muted-foreground"
              )}>
                {leadScore ?? "--"}
              </p>
              {leadScore != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  out of 100
                </p>
              )}
              {scoreBadge && (
                <span className={cn("inline-block mt-2 text-xs px-2.5 py-1 rounded-lg border font-medium capitalize", scoreBadge.colors)}>
                  {scoreBadge.label}
                </span>
              )}
            </div>
          </div>

          {/* Attribution */}
          {(source || channelTag || utmSource || utmMedium || utmCampaign || createdAt) && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Attribution</h2>
              <div className="space-y-2 text-xs">
                {source && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-800 rounded font-medium">
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
      </div>
    </div>
  )
}
