"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  Mail,
  FileSignature,
  FileCode2,
  PenLine,
  Hash,
  Trash2,
  Copy,
  Check,
  Library,
  Pencil,
  X,
} from "lucide-react"

interface Template {
  id: string
  type: string
  title: string
  body: string
  variables: string[]
  tags: string[]
  isPublic: boolean
  isMine: boolean
  updatedAt: string
}

const TYPES = [
  { value: "email", label: "Email", Icon: Mail },
  { value: "proposal", label: "Proposal", Icon: FileSignature },
  { value: "script", label: "Script", Icon: FileCode2 },
  { value: "content", label: "Content", Icon: PenLine },
  { value: "snippet", label: "Snippet", Icon: Hash },
] as const

type TypeValue = (typeof TYPES)[number]["value"] | "all"

const TYPE_ICON_MAP: Record<string, (typeof TYPES)[number]["Icon"]> = {
  email: Mail,
  proposal: FileSignature,
  script: FileCode2,
  content: PenLine,
  snippet: Hash,
}

export function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: Template[]
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [activeType, setActiveType] = useState<TypeValue>("all")
  const [activeScope, setActiveScope] = useState<"mine" | "public" | "all">(
    "all",
  )
  const [copied, setCopied] = useState<string | null>(null)
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeType !== "all" && t.type !== activeType) return false
      if (activeScope === "mine" && !t.isMine) return false
      if (activeScope === "public" && !t.isPublic) return false
      return true
    })
  }, [templates, activeType, activeScope])

  const handleCopy = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template? This can't be undone.")) return
    const res = await fetch(`/api/portal/templates/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } else {
      alert("Couldn't delete the template — try again.")
    }
  }

  const handleSaveNew = async (data: {
    type: string
    title: string
    body: string
    tags: string[]
  }) => {
    const res = await fetch("/api/portal/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setTemplates((prev) => [
        { ...json.template, isMine: true, updatedAt: json.template.updatedAt },
        ...prev,
      ])
      setCreating(false)
    } else {
      alert("Couldn't save template.")
    }
  }

  const handleSaveEdit = async (id: string, data: {
    title: string
    body: string
    tags: string[]
  }) => {
    const res = await fetch(`/api/portal/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...json.template, isMine: t.isMine, updatedAt: json.template.updatedAt }
            : t,
        ),
      )
      setEditing(null)
    } else {
      alert("Couldn't update template.")
    }
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeType === "all"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            }`}
          >
            All types
          </button>
          {TYPES.map((t) => {
            const Icon = t.Icon
            const active = activeType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card overflow-hidden flex">
            {(["all", "mine", "public"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setActiveScope(scope)}
                className={`px-3 py-1.5 text-xs font-medium ${
                  activeScope === scope
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {scope === "mine"
                  ? "Mine"
                  : scope === "public"
                    ? "Curated"
                    : "All"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New template
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <Library className="h-6 w-6 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground mb-1">No templates here yet</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Save your favorite emails, proposal blocks, or scripts here once
            and reuse them anywhere on the platform.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const Icon = TYPE_ICON_MAP[t.type] ?? Hash
            return (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {t.title}
                    </h3>
                  </div>
                  {t.isPublic ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      Curated
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-4 mb-3 whitespace-pre-wrap font-mono leading-relaxed">
                  {t.body}
                </p>

                {t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(t.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(t.id, t.body)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      title="Copy body"
                    >
                      {copied === t.id ? (
                        <Check className="h-3 w-3 text-emerald-700" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied === t.id ? "Copied" : "Copy"}
                    </button>
                    {t.isMine && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <TemplateModal
          onClose={() => setCreating(false)}
          onSave={handleSaveNew}
        />
      )}
      {editing && (
        <TemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSave={(data) =>
            handleSaveEdit(editing.id, {
              title: data.title,
              body: data.body,
              tags: data.tags,
            })
          }
        />
      )}
    </div>
  )
}

function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template?: Template
  onClose: () => void
  onSave: (data: {
    type: string
    title: string
    body: string
    tags: string[]
  }) => void | Promise<void>
}) {
  const [type, setType] = useState(template?.type ?? "email")
  const [title, setTitle] = useState(template?.title ?? "")
  const [body, setBody] = useState(template?.body ?? "")
  const [tagsInput, setTagsInput] = useState((template?.tags ?? []).join(", "))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await onSave({ type, title: title.trim(), body, tags })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            {template ? "Edit template" : "New template"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
          {!template && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      type === t.value
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Discovery call follow-up"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Body
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={20_000}
              rows={12}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/40 leading-relaxed"
              placeholder="Hi {{contact.firstName}},&#10;&#10;Great talking with you yesterday..."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Use{" "}
              <code className="px-1 rounded bg-muted">
                {"{{contact.firstName}}"}
              </code>{" "}
              and{" "}
              <code className="px-1 rounded bg-muted">
                {"{{company.name}}"}
              </code>{" "}
              variables; they merge at use-time.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="follow-up, discovery, B2B"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !body.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : template ? "Save changes" : "Create template"}
          </button>
        </div>
      </form>
    </div>
  )
}
