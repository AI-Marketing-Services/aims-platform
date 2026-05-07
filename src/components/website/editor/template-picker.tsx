/* eslint-disable @next/next/no-img-element */
"use client"

import { Check } from "lucide-react"

interface TemplateClient {
  id: string
  name: string
  tagline: string
  bestFor: string
  thumbnailUrl: string
  mode: "light" | "dark"
}

interface Props {
  templates: TemplateClient[]
  activeTemplateId: string | null
  onPick: (templateId: string) => void
}

/**
 * Visual template picker — three cards, click-to-select. Highlights the
 * active template with a brand-color border + check badge so the
 * operator always knows which design they're editing.
 *
 * Thumbnails fall back to a generated SVG block if the file isn't in
 * /public/website-templates/ yet — so the picker still feels finished
 * while we ship template assets in a follow-up.
 */
export function TemplatePicker({ templates, activeTemplateId, onPick }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Pick a template
        </p>
        <p className="text-[11px] text-muted-foreground">
          Each template is a complete website. You can switch any time —
          your saved copy carries over to the new layout.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((tpl) => {
          const active = tpl.id === activeTemplateId
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onPick(tpl.id)}
              className={`group relative flex flex-col rounded-xl border bg-card p-3 text-left transition-all ${
                active
                  ? "border-primary ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              {/* Thumbnail — falls back to gradient block if missing */}
              <div className="aspect-[16/10] w-full overflow-hidden rounded-md border border-border/40 bg-muted/40">
                <img
                  src={tpl.thumbnailUrl}
                  alt={`${tpl.name} preview`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {tpl.name}
                  </p>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tpl.mode}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {tpl.tagline}
                </p>
                <p className="text-[10px] text-muted-foreground/70 italic">
                  Best for: {tpl.bestFor}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
