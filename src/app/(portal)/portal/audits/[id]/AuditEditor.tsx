"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Globe,
  Loader2,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Palette,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react"
import type { QuizOption, QuizQuestion, QuestionType } from "@/lib/audits/types"

export interface AuditQuizDto {
  id: string
  slug: string
  title: string
  subtitle: string | null
  ctaLabel: string
  logoUrl: string | null
  brandColor: string | null
  accentColor: string | null
  customDomain: string | null
  successHeadline: string | null
  successMessage: string | null
  successCta: string | null
  successCtaUrl: string | null
  collectEmail: boolean
  emailRequired: boolean
  isPublished: boolean
  questions: QuizQuestion[]
  responseCount: number
  updatedAt: string
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  short_text: "Short text",
  long_text: "Long text",
  number: "Number",
  email: "Email",
}

const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  "single_select",
  "multi_select",
  "short_text",
  "long_text",
  "number",
  "email",
]

function typeSupportsOptions(type: QuestionType): boolean {
  return type === "single_select" || type === "multi_select"
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

function isValidHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

interface EditorState {
  title: string
  subtitle: string
  ctaLabel: string
  logoUrl: string
  brandColor: string
  accentColor: string
  customDomain: string
  successHeadline: string
  successMessage: string
  successCta: string
  successCtaUrl: string
  collectEmail: boolean
  emailRequired: boolean
  isPublished: boolean
  questions: QuizQuestion[]
}

function toEditorState(quiz: AuditQuizDto): EditorState {
  return {
    title: quiz.title,
    subtitle: quiz.subtitle ?? "",
    ctaLabel: quiz.ctaLabel,
    logoUrl: quiz.logoUrl ?? "",
    brandColor: quiz.brandColor ?? "",
    accentColor: quiz.accentColor ?? "",
    customDomain: quiz.customDomain ?? "",
    successHeadline: quiz.successHeadline ?? "",
    successMessage: quiz.successMessage ?? "",
    successCta: quiz.successCta ?? "",
    successCtaUrl: quiz.successCtaUrl ?? "",
    collectEmail: quiz.collectEmail,
    emailRequired: quiz.emailRequired,
    isPublished: quiz.isPublished,
    questions: quiz.questions.map((q) => ({
      ...q,
      options: q.options ? q.options.map((o) => ({ ...o })) : undefined,
    })),
  }
}

function isEqual(a: EditorState, b: EditorState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

interface PatchPayload {
  title?: string
  subtitle?: string | null
  ctaLabel?: string
  logoUrl?: string | null
  brandColor?: string | null
  accentColor?: string | null
  customDomain?: string | null
  successHeadline?: string | null
  successMessage?: string | null
  successCta?: string | null
  successCtaUrl?: string | null
  collectEmail?: boolean
  emailRequired?: boolean
  isPublished?: boolean
  questions?: QuizQuestion[]
}

function normalizeQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => {
    const next: QuizQuestion = {
      id: q.id,
      label: q.label.trim(),
      type: q.type,
    }
    if (q.required) next.required = true
    const helper = q.helper?.trim()
    if (helper) next.helper = helper
    const placeholder = q.placeholder?.trim()
    if (placeholder && !typeSupportsOptions(q.type)) {
      next.placeholder = placeholder
    }
    if (typeSupportsOptions(q.type) && q.options) {
      next.options = q.options.map((opt) => ({
        id: opt.id,
        label: opt.label.trim(),
        ...(opt.value !== undefined ? { value: opt.value } : {}),
      }))
    }
    return next
  })
}

function buildPatchPayload(state: EditorState): PatchPayload {
  return {
    title: state.title.trim(),
    subtitle: state.subtitle.trim() || null,
    ctaLabel: state.ctaLabel.trim() || "Start",
    logoUrl: state.logoUrl.trim() || null,
    brandColor: state.brandColor.trim() || null,
    accentColor: state.accentColor.trim() || null,
    customDomain: state.customDomain.trim() || null,
    successHeadline: state.successHeadline.trim() || null,
    successMessage: state.successMessage.trim() || null,
    successCta: state.successCta.trim() || null,
    successCtaUrl: state.successCtaUrl.trim() || null,
    collectEmail: state.collectEmail,
    emailRequired: state.emailRequired,
    isPublished: state.isPublished,
    questions: normalizeQuestions(state.questions),
  }
}

function validateState(state: EditorState): string | null {
  if (!state.title.trim()) return "Title is required."
  if (!state.ctaLabel.trim()) return "CTA label is required."
  if (state.questions.length === 0) return "Add at least one question."
  for (const q of state.questions) {
    if (!q.label.trim()) return "Every question needs a label."
    if (typeSupportsOptions(q.type)) {
      if (!q.options || q.options.length < 2)
        return `"${q.label}" needs at least 2 options.`
      if (q.options.some((o) => !o.label.trim()))
        return `"${q.label}" has an option with an empty label.`
    }
  }
  if (state.brandColor && !isValidHex(state.brandColor))
    return "Brand color must be a hex like #C4972A."
  if (state.accentColor && !isValidHex(state.accentColor))
    return "Accent color must be a hex like #C4972A."
  if (state.logoUrl) {
    try {
      new URL(state.logoUrl)
    } catch {
      return "Logo URL must be a full URL."
    }
  }
  if (state.successCtaUrl) {
    try {
      new URL(state.successCtaUrl)
    } catch {
      return "Success CTA URL must be a full URL."
    }
  }
  return null
}

interface LiveUrlRowProps {
  label: string
  host: string
  url: string
}

function LiveUrlRow({ label, host, url }: LiveUrlRowProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `https://${host}${url}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — keyboard copy still works
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-28">
        {label}
      </span>
      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-mono text-xs text-foreground truncate flex-1">
        {host}
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

const textareaClass = `${inputClass} min-h-[72px] resize-y`

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start justify-between gap-4 w-full text-left rounded-lg border border-border bg-background px-3 py-2.5 hover:border-primary/30 transition-all"
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </span>
        )}
      </span>
      <span
        className={`mt-1 h-5 w-9 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  )
}

interface QuestionCardProps {
  question: QuizQuestion
  index: number
  total: number
  onChange: (next: QuizQuestion) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: QuestionCardProps) {
  const supportsOptions = typeSupportsOptions(question.type)
  const options = question.options ?? []

  const updateField = <K extends keyof QuizQuestion>(
    key: K,
    value: QuizQuestion[K]
  ) => onChange({ ...question, [key]: value })

  const updateOption = (optionIndex: number, next: Partial<QuizOption>) => {
    const nextOptions = options.map((opt, i) =>
      i === optionIndex ? { ...opt, ...next } : opt
    )
    onChange({ ...question, options: nextOptions })
  }

  const addOption = () => {
    const next = [
      ...options,
      { id: generateId("opt"), label: "" } satisfies QuizOption,
    ]
    onChange({ ...question, options: next })
  }

  const removeOption = (optionIndex: number) => {
    const next = options.filter((_, i) => i !== optionIndex)
    onChange({ ...question, options: next })
  }

  const handleTypeChange = (type: QuestionType) => {
    if (typeSupportsOptions(type)) {
      const seeded =
        options.length > 0
          ? options
          : [
              { id: generateId("opt"), label: "Option 1" },
              { id: generateId("opt"), label: "Option 2" },
            ]
      onChange({ ...question, type, options: seeded })
    } else {
      onChange({ ...question, type, options: undefined })
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary text-xs font-semibold shrink-0">
            {index + 1}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
            title="Delete question"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Field label="Question">
        <input
          type="text"
          value={question.label}
          onChange={(e) => updateField("label", e.target.value)}
          className={inputClass}
          placeholder="What's your role?"
        />
      </Field>

      <Field label="Helper text (optional)">
        <input
          type="text"
          value={question.helper ?? ""}
          onChange={(e) => updateField("helper", e.target.value || undefined)}
          className={inputClass}
          placeholder="Shown beneath the question"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Type">
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className={inputClass}
          >
            {QUESTION_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Required">
          <select
            value={question.required ? "yes" : "no"}
            onChange={(e) =>
              updateField("required", e.target.value === "yes" ? true : undefined)
            }
            className={inputClass}
          >
            <option value="no">Optional</option>
            <option value="yes">Required</option>
          </select>
        </Field>
      </div>

      {!supportsOptions && (
        <Field label="Placeholder (optional)">
          <input
            type="text"
            value={question.placeholder ?? ""}
            onChange={(e) =>
              updateField("placeholder", e.target.value || undefined)
            }
            className={inputClass}
            placeholder="Shown inside an empty input"
          />
        </Field>
      )}

      {supportsOptions && (
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Options
          </span>
          <div className="space-y-2">
            {options.map((option, optionIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) =>
                    updateOption(optionIndex, { label: e.target.value })
                  }
                  className={inputClass}
                  placeholder={`Option ${optionIndex + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(optionIndex)}
                  disabled={options.length <= 2}
                  className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                  title={
                    options.length <= 2
                      ? "Need at least 2 options"
                      : "Remove option"
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </button>
        </div>
      )}
    </div>
  )
}

export interface AuditEditorSite {
  /** Operator's AOC subdomain — e.g. "acme" → acme.aioperatorcollective.com */
  subdomain: string
  /** Verified + published custom domain, or null if not yet live */
  customDomain: string | null
}

interface AuditEditorProps {
  quiz: AuditQuizDto
  site?: AuditEditorSite | null
}

export function AuditEditor({ quiz, site }: AuditEditorProps) {
  const router = useRouter()
  const [original, setOriginal] = useState<EditorState>(() => toEditorState(quiz))
  const [state, setState] = useState<EditorState>(() => toEditorState(quiz))
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const liveRegionRef = useRef<HTMLSpanElement | null>(null)
  const logoFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const dirty = useMemo(() => !isEqual(original, state), [original, state])
  const validationError = useMemo(() => validateState(state), [state])

  const shareLink = origin
    ? `${origin}/q/${quiz.slug}`
    : `/q/${quiz.slug}`

  const handleCopy = async () => {
    if (!origin) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — keyboard copy still works
    }
  }

  const updateField = <K extends keyof EditorState>(
    key: K,
    value: EditorState[K]
  ) => setState((prev) => ({ ...prev, [key]: value }))

  const updateQuestion = (questionId: string, next: QuizQuestion) =>
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? next : q)),
    }))

  const moveQuestion = (questionId: string, direction: -1 | 1) =>
    setState((prev) => {
      const idx = prev.questions.findIndex((q) => q.id === questionId)
      if (idx === -1) return prev
      const target = idx + direction
      if (target < 0 || target >= prev.questions.length) return prev
      const next = [...prev.questions]
      const [moved] = next.splice(idx, 1)
      next.splice(target, 0, moved)
      return { ...prev, questions: next }
    })

  const removeQuestion = (questionId: string) =>
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }))

  const addQuestion = () =>
    setState((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: generateId("q"),
          label: "New question",
          type: "short_text",
          required: false,
        },
      ],
    }))

  const handleSave = async () => {
    if (saving) return
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/portal/audits/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPatchPayload(state)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Failed to save changes")
      }
      // Snapshot the saved state so the diff resets to clean.
      setOriginal(state)
      setSavedAt(new Date().toLocaleTimeString())
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "Changes saved."
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (archiving) return
    if (
      !window.confirm(
        "Archive this audit? The public link will stop working but historical responses are preserved."
      )
    ) {
      return
    }
    setArchiving(true)
    setError(null)
    try {
      const res = await fetch(`/api/portal/audits/${quiz.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Failed to archive audit")
      }
      router.push("/portal/audits")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive audit")
      setArchiving(false)
    }
  }

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    // Reset the input so picking the same file twice still triggers change.
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = ""
    }
    if (!file) return

    setLogoUploadError(null)
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/portal/audits/${quiz.id}/logo`, {
        method: "POST",
        body: formData,
      })
      const body = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? "Upload failed")
      }
      // Mirror the uploaded URL into both the editor's working state and the
      // baseline so the change doesn't show up as "unsaved" — the server has
      // already persisted it.
      setState((prev) => ({ ...prev, logoUrl: body.url ?? "" }))
      setOriginal((prev) => ({ ...prev, logoUrl: body.url ?? "" }))
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "Logo uploaded."
      }
    } catch (err) {
      setLogoUploadError(
        err instanceof Error ? err.message : "Upload failed"
      )
    } finally {
      setUploadingLogo(false)
    }
  }

  const previewBrand = state.brandColor && isValidHex(state.brandColor)
    ? state.brandColor
    : "#C4972A"

  return (
    <div className="space-y-8">
      {/* Header / share */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">Edit audit</h1>
        <p className="text-xs text-muted-foreground">
          Customize branding, questions, and the success page. Share the public
          link with prospects.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono text-foreground">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="truncate max-w-[260px] sm:max-w-md">
              {shareLink}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <a
            href={`/q/${quiz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              state.isPublished
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-muted/40 text-muted-foreground border-border"
            }`}
          >
            {state.isPublished ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {state.isPublished ? "Live" : "Draft"}
          </span>
        </div>
      </div>

      {/* Section: Branding & content */}
      <Section title="Brand & content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={state.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={inputClass}
              placeholder="AI Audit"
            />
          </Field>
          <Field label="CTA label">
            <input
              type="text"
              value={state.ctaLabel}
              onChange={(e) => updateField("ctaLabel", e.target.value)}
              className={inputClass}
              placeholder="Start the Audit"
            />
          </Field>
        </div>
        <Field label="Subtitle">
          <textarea
            value={state.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            className={textareaClass}
            placeholder="One-liner that frames the quiz"
          />
        </Field>
        <Field
          label="Logo"
          hint="Upload an image (PNG, JPEG, WebP, or SVG, up to 2 MB) or paste a hosted asset URL."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background"
                aria-hidden="true"
              >
                {state.logoUrl ? (
                  // Use a plain <img> here so any external host works without
                  // configuring next/image remotePatterns at build time.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.logoUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="sr-only"
                  aria-label="Upload logo"
                />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploadingLogo ? "Uploading…" : "Upload logo"}
                </button>
                {state.logoUrl && !uploadingLogo && (
                  <button
                    type="button"
                    onClick={() => updateField("logoUrl", "")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            {logoUploadError && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {logoUploadError}
              </span>
            )}
            <input
              type="url"
              value={state.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              className={inputClass}
              placeholder="Or paste a logo URL — https://example.com/logo.png"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorPicker
            label="Brand color"
            value={state.brandColor}
            onChange={(v) => updateField("brandColor", v)}
          />
          <ColorPicker
            label="Accent color"
            value={state.accentColor}
            onChange={(v) => updateField("accentColor", v)}
          />
        </div>

        <Field
          label="Where this audit is live"
          hint={
            site?.customDomain
              ? "Your verified custom domain auto-hosts this audit. No extra setup."
              : "Verify your operator site domain in Settings → Domain to also host this audit on your custom URL."
          }
        >
          <div className="space-y-2">
            <LiveUrlRow
              label="Platform link"
              url={`/q/${quiz.slug}`}
              host="aioperatorcollective.com"
            />
            {site?.subdomain && (
              <LiveUrlRow
                label="Your subdomain"
                url={`/q/${quiz.slug}`}
                host={`${site.subdomain}.aioperatorcollective.com`}
              />
            )}
            {site?.customDomain && (
              <LiveUrlRow
                label="Your custom domain"
                url={`/q/${quiz.slug}`}
                host={site.customDomain}
              />
            )}
          </div>
        </Field>

        {/* Live preview of brand color application */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Brand preview
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: previewBrand }}
            >
              {state.ctaLabel || "Start"}
            </span>
            <span className="text-xs text-muted-foreground">
              CTA buttons will use this color
            </span>
          </div>
        </div>
      </Section>

      {/* Section: questions */}
      <Section
        title="Questions"
        right={
          <span className="text-[11px] text-muted-foreground">
            {state.questions.length} total
          </span>
        }
      >
        <div className="space-y-3">
          {state.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              total={state.questions.length}
              onChange={(next) => updateQuestion(question.id, next)}
              onMove={(dir) => moveQuestion(question.id, dir)}
              onRemove={() => removeQuestion(question.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add question
        </button>
      </Section>

      {/* Section: lead capture */}
      <Section title="Lead capture">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            checked={state.collectEmail}
            onChange={(v) => updateField("collectEmail", v)}
            label="Collect email"
            description="Show the email field on the public form."
          />
          <Toggle
            checked={state.emailRequired}
            onChange={(v) => updateField("emailRequired", v)}
            label="Email required"
            description="Block submission without an email."
          />
        </div>
      </Section>

      {/* Section: success page */}
      <Section title="Success page">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Headline">
            <input
              type="text"
              value={state.successHeadline}
              onChange={(e) => updateField("successHeadline", e.target.value)}
              className={inputClass}
              placeholder="Thanks — we've got it."
            />
          </Field>
          <Field label="CTA label (optional)">
            <input
              type="text"
              value={state.successCta}
              onChange={(e) => updateField("successCta", e.target.value)}
              className={inputClass}
              placeholder="Book a call"
            />
          </Field>
        </div>
        <Field label="Message">
          <textarea
            value={state.successMessage}
            onChange={(e) => updateField("successMessage", e.target.value)}
            className={textareaClass}
            placeholder="Shown after a successful submission"
          />
        </Field>
        <Field label="CTA URL (optional)">
          <input
            type="url"
            value={state.successCtaUrl}
            onChange={(e) => updateField("successCtaUrl", e.target.value)}
            className={inputClass}
            placeholder="https://cal.com/you/intro"
          />
        </Field>
      </Section>

      {/* Section: visibility & danger zone */}
      <Section title="Visibility">
        <Toggle
          checked={state.isPublished}
          onChange={(v) => updateField("isPublished", v)}
          label="Published"
          description="When off, the public link returns a 'not available' page."
        />
        <button
          type="button"
          onClick={handleArchive}
          disabled={archiving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-60"
        >
          {archiving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Archive audit
        </button>
      </Section>

      <span ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {error ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-500 truncate">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </span>
            ) : validationError ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 truncate">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {validationError}
              </span>
            ) : dirty ? (
              <span className="text-xs text-muted-foreground">
                Unsaved changes
              </span>
            ) : savedAt ? (
              <span className="text-xs text-muted-foreground">
                Saved at {savedAt}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Last updated {new Date(quiz.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || Boolean(validationError)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

interface ColorPickerProps {
  label: string
  value: string
  onChange: (next: string) => void
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const valid = !value || isValidHex(value)
  return (
    <Field label={label} hint={valid ? undefined : "Use a hex like #C4972A"}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(value) ? value : "#C4972A"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border border-border bg-background cursor-pointer"
          aria-label={`${label} swatch`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="#C4972A"
        />
      </div>
    </Field>
  )
}
