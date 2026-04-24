"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"

const FONT_OPTIONS = [
  "DM Sans",
  "Inter",
  "Cormorant Garamond",
  "Playfair Display",
  "Space Grotesk",
] as const

type FontOption = (typeof FONT_OPTIONS)[number]

interface BrandingValues {
  businessName: string
  tagline: string
  logoUrl: string
  faviconUrl: string
  brandColor: string
  accentColor: string
  fontHeading: string
}

interface Props {
  initialValues: BrandingValues
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-md border border-border cursor-pointer bg-transparent p-0.5"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          maxLength={7}
          placeholder="#C4972A"
          className="flex-1 h-9 rounded-md border border-border bg-surface px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

function ImageUploadField({
  label,
  hint,
  value,
  fieldKey,
  onUploaded,
}: {
  label: string
  hint: string
  value: string
  fieldKey: "logo" | "favicon"
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/portal/onboarding/upload", {
        method: "POST",
        body: form,
      })
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string }
      if (!data.ok || !data.url) {
        toast.error(data.error ?? "Upload failed")
        return
      }
      onUploaded(data.url)
      toast.success(`${label} uploaded`)
    } catch {
      toast.error("Upload failed — please try again")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <div className="flex items-center gap-3">
        {value && (
          <div className="relative h-10 w-10 rounded-md border border-border bg-muted overflow-hidden flex-shrink-0">
            <Image src={value} alt={label} fill className="object-contain p-0.5" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border bg-surface text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
          aria-label={`Upload ${label}`}
        />
      </div>
    </div>
  )
}

function PreviewPanel({ values }: { values: BrandingValues }) {
  const fontStyle = { fontFamily: `'${values.fontHeading}', sans-serif` }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Live Preview
        </p>
      </div>
      {/* Mock portal header */}
      <div
        className="p-6 space-y-4"
        style={{ backgroundColor: values.brandColor + "14" }}
      >
        <div className="flex items-center gap-3">
          {values.logoUrl ? (
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image src={values.logoUrl} alt="Logo" fill className="object-contain" />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: values.brandColor }}
            />
          )}
          <div>
            <p
              className="text-base font-bold text-foreground"
              style={fontStyle}
            >
              {values.businessName || "Your Business Name"}
            </p>
            {values.tagline && (
              <p className="text-xs text-muted-foreground">{values.tagline}</p>
            )}
          </div>
        </div>

        {/* Mock nav bar */}
        <div className="flex items-center gap-2">
          {["Dashboard", "Services", "Account"].map((item) => (
            <button
              key={item}
              type="button"
              className="px-3 py-1.5 text-xs rounded-md font-medium"
              style={
                item === "Dashboard"
                  ? {
                      backgroundColor: values.brandColor,
                      color: "#fff",
                      fontFamily: fontStyle.fontFamily,
                    }
                  : {
                      color: "#888",
                      fontFamily: fontStyle.fontFamily,
                    }
              }
            >
              {item}
            </button>
          ))}
        </div>

        {/* Mock card */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p
            className="text-sm font-semibold text-foreground"
            style={fontStyle}
          >
            Welcome back
          </p>
          <p className="text-xs text-muted-foreground">
            Your portal is powered by {values.businessName || "your brand"}.
          </p>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md font-medium text-white"
            style={{ backgroundColor: values.accentColor || values.brandColor }}
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}

export function BrandingForm({ initialValues }: Props) {
  const [values, setValues] = useState<BrandingValues>(initialValues)
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof BrandingValues>(key: K, value: BrandingValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch("/api/reseller/brand", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast.error(data.error ?? "Failed to save branding")
          return
        }
        toast.success("Branding saved")
      } catch {
        toast.error("Failed to save — please try again")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Form fields */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Business name */}
          <div className="space-y-1.5">
            <label
              htmlFor="businessName"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={values.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Acme AI Solutions"
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <label
              htmlFor="tagline"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Tagline
            </label>
            <input
              id="tagline"
              type="text"
              value={values.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="AI-powered growth for your business"
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Logo */}
          <ImageUploadField
            label="Logo"
            hint="Recommended: PNG or SVG, at least 200×200 px, transparent background."
            value={values.logoUrl}
            fieldKey="logo"
            onUploaded={(url) => update("logoUrl", url)}
          />

          {/* Favicon */}
          <ImageUploadField
            label="Favicon"
            hint="Recommended: 32×32 px PNG or ICO."
            value={values.faviconUrl}
            fieldKey="favicon"
            onUploaded={(url) => update("faviconUrl", url)}
          />

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              label="Primary Brand Color"
              value={values.brandColor}
              onChange={(v) => update("brandColor", v)}
            />
            <ColorInput
              label="Accent Color"
              value={values.accentColor}
              onChange={(v) => update("accentColor", v)}
            />
          </div>

          {/* Font */}
          <div className="space-y-1.5">
            <label
              htmlFor="fontHeading"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Heading Font
            </label>
            <select
              id="fontHeading"
              value={values.fontHeading}
              onChange={(e) => update("fontHeading", e.target.value as FontOption)}
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {isPending ? "Saving…" : "Save Branding"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <PreviewPanel values={values} />
          <p className="text-[11px] text-muted-foreground px-1">
            Preview updates as you type. Your clients will see this branding on their portal.
          </p>
        </div>
      </div>
    </form>
  )
}
