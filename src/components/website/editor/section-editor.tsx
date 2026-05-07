"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { SectionType } from "@/lib/website/types"

interface SectionLite {
  id: string
  type: SectionType
  defaults: unknown
}

interface Props {
  section: SectionLite
  /** Current saved override for this section, or null if none. */
  currentContent: Record<string, unknown> | null
  onSave: (content: Record<string, unknown>) => Promise<void> | void
  onCancel: () => void
  saving: boolean
}

/**
 * Generic JSON-shape editor. Walks the merged content (defaults + any
 * existing override) and renders a form input per field, picking the
 * right input control by inspecting the existing value's type.
 *
 * Why generic instead of one form per section type:
 * - 14 sections × per-field forms = ~50 forms to maintain.
 * - The Zod schema on the server is the source of truth — the editor
 *   just needs to produce a JSON blob in roughly the right shape; the
 *   API rejects anything malformed.
 * - This keeps the editor lean and the section library easy to extend:
 *   add a new section schema + component, the editor renders it for
 *   free.
 *
 * Tradeoff: input UX is utilitarian. v2 will introduce per-section
 * custom forms for the highest-friction sections (pricing, FAQ).
 */
export function SectionEditor({
  section,
  currentContent,
  onSave,
  onCancel,
  saving,
}: Props) {
  // Merge defaults with any saved overrides. The editor edits this
  // merged value — saving it sends the full merged shape to the API,
  // which validates against the section schema.
  const initial = useMemo(() => {
    const defaults =
      typeof section.defaults === "object" &&
      section.defaults !== null &&
      !Array.isArray(section.defaults)
        ? (section.defaults as Record<string, unknown>)
        : {}
    return { ...defaults, ...(currentContent ?? {}) }
  }, [section.defaults, currentContent])

  const [draft, setDraft] = useState<Record<string, unknown>>(initial)

  function setField(path: string[], value: unknown) {
    setDraft((prev) => setIn(prev, path, value))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {Object.entries(initial).map(([key, defaultValue]) => (
          <FieldRenderer
            key={key}
            label={humanLabel(key)}
            path={[key]}
            value={draft[key] ?? defaultValue}
            onChange={(v) => setField([key], v)}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Save section
        </button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Field renderer — picks the right control based on the value type.
// String → text/textarea. Boolean → checkbox. Array of strings → list.
// Array of objects → editable repeater. Object → recursive group.
// ────────────────────────────────────────────────────────────────────
function FieldRenderer({
  label,
  path,
  value,
  onChange,
}: {
  label: string
  path: string[]
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border accent-primary"
        />
        {label}
      </label>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <ArrayEditor value={value} onChange={onChange} pathHint={path.join(".")} />
      </div>
    )
  }

  if (typeof value === "object" && value !== null) {
    return (
      <fieldset className="space-y-2 rounded-md border border-border/40 p-3">
        <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {label}
        </legend>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <FieldRenderer
            key={k}
            label={humanLabel(k)}
            path={[...path, k]}
            value={v}
            onChange={(next) => {
              onChange({ ...(value as Record<string, unknown>), [k]: next })
            }}
          />
        ))}
      </fieldset>
    )
  }

  // String — use textarea for long copy, single-line input otherwise.
  const text = value == null ? "" : String(value)
  const long = text.length > 60 || /headline|subheadline|description|body|quote|answer|tagline/i.test(label)

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {long ? (
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(6, Math.max(2, Math.ceil(text.length / 60)))}
          className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  )
}

function ArrayEditor({
  value,
  onChange,
  pathHint,
}: {
  value: unknown[]
  onChange: (v: unknown[]) => void
  pathHint: string
}) {
  // Strings: inline list; objects: stacked cards
  const allStrings = value.every((v) => typeof v === "string")

  if (allStrings) {
    return (
      <div className="space-y-1.5">
        {(value as string[]).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...(value as string[])]
                next[idx] = e.target.value
                onChange(next)
              }}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              className="text-[10px] text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...(value as unknown[]), ""])}
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          + Add item
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {value.map((item, idx) => (
        <div
          key={idx}
          className="rounded-md border border-border/60 bg-background p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {pathHint.split(".").pop()} #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              className="text-[10px] text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
          {typeof item === "object" && item !== null ? (
            Object.entries(item as Record<string, unknown>).map(([k, v]) => (
              <FieldRenderer
                key={k}
                label={humanLabel(k)}
                path={[k]}
                value={v}
                onChange={(next) => {
                  const updated = [...(value as unknown[])]
                  updated[idx] = {
                    ...(item as Record<string, unknown>),
                    [k]: next,
                  }
                  onChange(updated)
                }}
              />
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground italic">
              (Unsupported field shape)
            </span>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          // Best-effort new entry: clone the shape of the first item.
          const template =
            value.length > 0 && typeof value[0] === "object" && value[0] !== null
              ? Object.fromEntries(
                  Object.keys(value[0] as Record<string, unknown>).map((k) => [
                    k,
                    "",
                  ]),
                )
              : {}
          onChange([...value, template])
        }}
        className="text-[10px] font-semibold text-primary hover:underline"
      >
        + Add entry
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────
import { useMemo } from "react"

function humanLabel(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function setIn<T extends Record<string, unknown>>(
  obj: T,
  path: string[],
  value: unknown,
): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  return {
    ...obj,
    [head]:
      rest.length === 0
        ? value
        : setIn(
            ((obj[head] as Record<string, unknown>) ?? {}) as Record<
              string,
              unknown
            >,
            rest,
            value,
          ),
  } as T
}
