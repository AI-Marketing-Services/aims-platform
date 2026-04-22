"use client"

import { useState, useTransition, useRef } from "react"
import { Building2, Globe, Target, Users, Upload, X, Check, Palette, Tag } from "lucide-react"

interface Profile {
  businessName: string | null
  logoUrl: string | null
  oneLiner: string | null
  niche: string | null
  idealClient: string | null
  businessUrl: string | null
  brandColor: string | null
  tagline: string | null
}

interface Props {
  initialProfile: Profile | null
}

export function BusinessProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState<Profile>({
    businessName: initialProfile?.businessName ?? "",
    logoUrl: initialProfile?.logoUrl ?? "",
    oneLiner: initialProfile?.oneLiner ?? "",
    niche: initialProfile?.niche ?? "",
    idealClient: initialProfile?.idealClient ?? "",
    businessUrl: initialProfile?.businessUrl ?? "",
    brandColor: initialProfile?.brandColor ?? "#C4972A",
    tagline: initialProfile?.tagline ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.")
      return
    }
    setError(null)
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/portal/onboarding/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed")
      setProfile((prev) => ({ ...prev, logoUrl: data.url as string }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/portal/onboarding/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: profile.businessName || null,
            logoUrl: profile.logoUrl || null,
            oneLiner: profile.oneLiner || null,
            niche: profile.niche || null,
            idealClient: profile.idealClient || null,
            businessUrl: profile.businessUrl || null,
            brandColor: profile.brandColor || null,
            tagline: profile.tagline || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Save failed")
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Logo */}
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {profile.logoUrl ? (
            <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, logoUrl: "" }))}
                className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-16 w-16 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {isUploading ? "Uploading…" : "Logo"}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Business Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={profile.businessName ?? ""}
                onChange={(e) => handleChange("businessName", e.target.value)}
                maxLength={120}
                placeholder="e.g. Wolfe AI Consulting"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                value={profile.businessUrl ?? ""}
                onChange={(e) => handleChange("businessUrl", e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* One-liner */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
          One-liner <span className="text-muted-foreground font-normal normal-case tracking-normal">(what you do in one sentence)</span>
        </label>
        <input
          type="text"
          value={profile.oneLiner ?? ""}
          onChange={(e) => handleChange("oneLiner", e.target.value)}
          maxLength={280}
          placeholder="I help regional law firms cut document review time by 60% using AI."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {(profile.oneLiner ?? "").length}/280
        </p>
      </div>

      {/* Niche */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
          <Target className="inline h-3.5 w-3.5 mr-1" />
          Niche / Industry
        </label>
        <input
          type="text"
          value={profile.niche ?? ""}
          onChange={(e) => handleChange("niche", e.target.value)}
          maxLength={80}
          placeholder="e.g. Legal, Healthcare, Real Estate, E-commerce"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
      </div>

      {/* Ideal client */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
          <Users className="inline h-3.5 w-3.5 mr-1" />
          Ideal Client
        </label>
        <textarea
          value={profile.idealClient ?? ""}
          onChange={(e) => handleChange("idealClient", e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="10-50 person professional services firms that have repetitive document/data workflows and want to cut overhead without hiring."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {(profile.idealClient ?? "").length}/500
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
          <Tag className="inline h-3.5 w-3.5 mr-1" />
          Tagline <span className="text-muted-foreground font-normal normal-case tracking-normal">(shown on proposals)</span>
        </label>
        <input
          type="text"
          value={profile.tagline ?? ""}
          onChange={(e) => handleChange("tagline", e.target.value)}
          maxLength={120}
          placeholder="e.g. AI-Powered Operations for the Modern Business"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {(profile.tagline ?? "").length}/120
        </p>
      </div>

      {/* Brand color */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
          <Palette className="inline h-3.5 w-3.5 mr-1" />
          Brand Color <span className="text-muted-foreground font-normal normal-case tracking-normal">(used on proposal header)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={profile.brandColor ?? "#C4972A"}
            onChange={(e) => handleChange("brandColor", e.target.value)}
            className="h-10 w-10 rounded-lg border border-border bg-background cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={profile.brandColor ?? ""}
            onChange={(e) => handleChange("brandColor", e.target.value)}
            maxLength={7}
            placeholder="#C4972A"
            className="w-28 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 font-mono"
          />
          <div
            className="h-8 flex-1 rounded-lg border border-border"
            style={{ backgroundColor: profile.brandColor ?? "#C4972A" }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || isUploading}
        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? (
          "Saving…"
        ) : saved ? (
          <>
            <Check className="h-4 w-4" /> Saved
          </>
        ) : (
          "Save Profile"
        )}
      </button>
    </form>
  )
}
