"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  Pencil,
  Sparkles,
} from "lucide-react"
import type { SectionType } from "@/lib/website/types"
import { TemplatePicker } from "./template-picker"
import { SectionEditor } from "./section-editor"

interface TemplateClient {
  id: string
  name: string
  tagline: string
  bestFor: string
  thumbnailUrl: string
  mode: "light" | "dark"
  sections: Array<{ id: string; type: SectionType; defaults: unknown }>
}

interface ProfileSummary {
  businessName: string | null
  oneLiner: string | null
  tagline: string | null
  niche: string | null
  idealClient: string | null
  businessUrl: string | null
  logoUrl: string | null
  brandColor: string | null
  accentColor: string | null
  fontHeading: string | null
}

interface SiteSummary {
  activeTemplateId: string | null
  templateContent: Record<string, Record<string, unknown>>
  isPublished: boolean
  subdomain: string
  customDomain: string | null
  customDomainVerified: boolean
  websitePublishedAt: string | null
}

interface Props {
  site: SiteSummary | null
  profile: ProfileSummary | null
  templates: TemplateClient[]
}

export function WebsiteEditor({ site, profile, templates }: Props) {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    site?.activeTemplateId ?? templates[0]?.id ?? null,
  )
  const [overrides, setOverrides] = useState<Record<string, Record<string, unknown>>>(
    site?.templateContent ?? {},
  )
  const [isPublished, setIsPublished] = useState(site?.isPublished ?? false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeTemplateId) ?? null,
    [templates, activeTemplateId],
  )

  const previewUrl = useMemo(() => {
    if (!site) return null
    if (site.customDomain && site.customDomainVerified) {
      return `https://${site.customDomain}`
    }
    return `https://${site.subdomain}.aioperatorcollective.com`
  }, [site])

  const onPickTemplate = useCallback(async (templateId: string) => {
    // Set state ONLY after the server confirms. The previous version
    // optimistically flipped the picker before the PATCH; on PATCH
    // failure the picker stayed on the new template while the server
    // remained on the old one — a mismatch the user only discovered on
    // next page load.
    setSaving(true)
    try {
      const res = await fetch("/api/reseller/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTemplateId: templateId }),
      })
      if (!res.ok) throw new Error("Save failed")
      setActiveTemplateId(templateId)
      toast.success("Template selected — preview your site to see it live.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save template")
    } finally {
      setSaving(false)
    }
  }, [])

  const onAutofill = useCallback(async () => {
    if (
      !confirm(
        "Replace the current copy with text from your business profile? Your custom edits will be lost.",
      )
    )
      return
    setSaving(true)
    try {
      const res = await fetch("/api/reseller/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autofill: true }),
      })
      if (!res.ok) throw new Error("Save failed")
      // PATCH now returns the fresh templateContent directly — the
      // previous "second GET to refresh" pattern could silently blank
      // the operator's overrides if the GET returned a non-200 (e.g.
      // session expiry between the PATCH and the GET round-trip).
      const json = (await res.json().catch(() => ({}))) as {
        templateContent?: Record<string, Record<string, unknown>>
      }
      if (json.templateContent && typeof json.templateContent === "object") {
        setOverrides(json.templateContent)
      }
      toast.success("Copy refreshed from your business profile.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't auto-fill")
    } finally {
      setSaving(false)
    }
  }, [])

  const onSaveSection = useCallback(
    async (
      sectionId: string,
      sectionType: SectionType,
      content: Record<string, unknown>,
    ) => {
      setSaving(true)
      try {
        const res = await fetch("/api/reseller/website", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionContent: { sectionId, sectionType, content },
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            typeof json.error === "string"
              ? json.error
              : "Section save failed",
          )
        }
        setOverrides((prev) => ({ ...prev, [sectionId]: content }))
        setEditingSection(null)
        toast.success("Section saved.")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save")
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const onTogglePublish = useCallback(async () => {
    if (!site?.subdomain) {
      toast.error("Set a subdomain in /reseller/settings/domain first.")
      return
    }
    setSaving(true)
    try {
      const next = !isPublished
      const res = await fetch("/api/reseller/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: next }),
      })
      if (!res.ok) throw new Error("Save failed")
      setIsPublished(next)
      toast.success(next ? "Site published" : "Site unpublished")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't toggle")
    } finally {
      setSaving(false)
    }
  }, [isPublished, site])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Website</h1>
            <p className="text-xs text-muted-foreground">
              Pick a template, fill in your copy, publish under your domain.
              Lead form goes straight to your CRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {previewUrl && (
            <Link
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview live site
            </Link>
          )}
          <button
            type="button"
            onClick={onTogglePublish}
            disabled={saving || !activeTemplateId}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPublished ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {isPublished ? "Published" : "Publish"}
          </button>
        </div>
      </div>

      {/* Setup banner */}
      {!site && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You need to set up your operator subdomain before you can publish a
          website.{" "}
          <Link
            href="/reseller/settings/domain"
            className="font-semibold underline"
          >
            Set up your subdomain →
          </Link>
        </div>
      )}

      {/* Template picker */}
      <TemplatePicker
        templates={templates}
        activeTemplateId={activeTemplateId}
        onPick={onPickTemplate}
      />

      {/* Section list */}
      {activeTemplate && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Sections in {activeTemplate.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Click a section to edit its copy. Anything you don&apos;t
                override uses our default.
              </p>
            </div>
            <button
              type="button"
              onClick={onAutofill}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
              title="Replace canned copy with text from your MemberProfile"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto-fill from profile
            </button>
          </div>

          <ul className="divide-y divide-border/60">
            {activeTemplate.sections.map((section) => {
              const hasOverride = !!overrides[section.id]
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingSection(
                        editingSection === section.id ? null : section.id,
                      )
                    }
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                        {sectionEmoji(section.type)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {section.type.replace(/-/g, " ")}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {sectionDescription(section.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasOverride ? (
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                          Edited
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                          Default
                        </span>
                      )}
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                  {editingSection === section.id && (
                    <div className="border-t border-border/60 bg-muted/10 px-4 py-4">
                      <SectionEditor
                        section={section}
                        currentContent={overrides[section.id] ?? null}
                        onSave={(content) =>
                          onSaveSection(
                            section.id,
                            section.type,
                            content,
                          )
                        }
                        onCancel={() => setEditingSection(null)}
                        saving={saving}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Brand summary */}
      {profile && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Branding inherited from your profile
              </p>
              <p className="text-[11px] text-muted-foreground">
                Logo, colors, and font are pulled live — update them anywhere
                and your site re-renders.
              </p>
            </div>
          </div>
          <Link
            href="/reseller/settings/branding"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit branding →
          </Link>
        </div>
      )}
    </div>
  )
}

function sectionEmoji(type: SectionType): string {
  const map: Record<SectionType, string> = {
    navbar: "Nv",
    "hero-center": "H1",
    "hero-split": "H2",
    "logo-bar": "Lo",
    "feature-grid-3": "F3",
    "feature-grid-6": "F6",
    "feature-split": "Fs",
    "how-it-works": "HW",
    "testimonial-grid": "Tg",
    "testimonial-single": "Ts",
    "pricing-3": "Pr",
    faq: "FQ",
    "cta-form": "CF",
    footer: "Ft",
  }
  return map[type]
}

function sectionDescription(type: SectionType): string {
  const map: Record<SectionType, string> = {
    navbar: "Top sticky nav with logo + links",
    "hero-center": "Centered hero — eyebrow, big headline, dual CTA",
    "hero-split": "Split hero — copy left, visual right",
    "logo-bar": "Trusted-by logo strip",
    "feature-grid-3": "3-column feature grid with icons",
    "feature-grid-6": "Bento grid — 6 features",
    "feature-split": "Alternating left/right rows",
    "how-it-works": "Numbered process steps",
    "testimonial-grid": "Three testimonial cards",
    "testimonial-single": "One large quote",
    "pricing-3": "3-tier pricing table",
    faq: "Accordion FAQ",
    "cta-form": "Contact form → your CRM",
    footer: "Footer with links + social",
  }
  return map[type]
}
