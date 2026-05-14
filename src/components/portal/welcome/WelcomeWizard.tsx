"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  User as UserIcon,
  Palette,
  Globe,
  Search,
  Link2,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react"
import ScoutDemoStep from "./ScoutDemoStep"
import { CREDIT_BALANCE_EVENT } from "@/components/portal/CreditBadge"

type Step =
  | "intro"
  | "profile"
  | "branding"
  | "site"
  | "scout"
  | "connections"
  | "done"

const STEP_ORDER: Step[] = [
  "intro",
  "profile",
  "branding",
  "site",
  "scout",
  "connections",
  "done",
]

const STEP_META: Record<
  Step,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  intro: { label: "Welcome", icon: Sparkles },
  profile: { label: "Profile", icon: UserIcon },
  branding: { label: "Branding", icon: Palette },
  site: { label: "Your site", icon: Globe },
  scout: { label: "First leads", icon: Search },
  connections: { label: "Connect", icon: Link2 },
  done: { label: "Done", icon: Check },
}

interface InitialState {
  step: Step
  completedAt: string | null
  skippedAt: string | null
  profile: {
    businessName: string | null
    oneLiner: string | null
    niche: string | null
    idealClient: string | null
    businessUrl: string | null
    brandColor: string | null
    tagline: string | null
    logoUrl: string | null
  }
  userName: string | null
}

/**
 * First-run interactive wizard. Lives at /portal/welcome. New users are
 * auto-redirected here by the portal layout until `firstRunCompletedAt`
 * or `firstRunSkippedAt` is set.
 *
 * The wizard is intentionally LINEAR — each step gates on the previous
 * being complete enough to proceed. Resume-on-refresh works because
 * the active step is persisted server-side via PATCH /welcome/state.
 *
 * Each step is a small inline component below; we don't break them
 * into separate files because (a) they all share local state and (b)
 * coordinating skip/back/next is much simpler with one file. If any
 * step grows past ~80 lines, extract it.
 */
export function WelcomeWizard({ initial }: { initial: InitialState }) {
  const router = useRouter()
  const [step, setStepRaw] = useState<Step>(initial.step)
  const [businessName, setBusinessName] = useState(
    initial.profile.businessName ?? "",
  )
  const [niche, setNiche] = useState(initial.profile.niche ?? "")
  const [oneLiner, setOneLiner] = useState(initial.profile.oneLiner ?? "")
  const [idealClient, setIdealClient] = useState(
    initial.profile.idealClient ?? "",
  )
  const [businessUrl, setBusinessUrl] = useState(
    initial.profile.businessUrl ?? "",
  )
  const [brandColor, setBrandColor] = useState(
    initial.profile.brandColor ?? "#C4972A",
  )
  const [tagline, setTagline] = useState(initial.profile.tagline ?? "")
  const [logoUrl, setLogoUrl] = useState(initial.profile.logoUrl ?? "")
  const [logoUploading, setLogoUploading] = useState(false)
  const [subdomain, setSubdomain] = useState(
    deriveSubdomain(initial.profile.businessName ?? initial.userName ?? ""),
  )
  const [siteProvisioned, setSiteProvisioned] = useState(false)
  const [siteError, setSiteError] = useState<string | null>(null)
  const [scoutLocation, setScoutLocation] = useState("")
  const [scoutBusinessType, setScoutBusinessType] = useState(
    initial.profile.niche ?? "",
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Persist step changes server-side so resume works on refresh.
  const setStep = useCallback(async (next: Step) => {
    setStepRaw(next)
    void fetch("/api/portal/welcome/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: next }),
    }).catch(() => {})
  }, [])

  const currentIdx = STEP_ORDER.indexOf(step)
  const progressPercent = Math.round(
    (currentIdx / (STEP_ORDER.length - 1)) * 100,
  )

  async function saveProfile() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/onboarding/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim() || null,
          niche: niche.trim() || null,
          oneLiner: oneLiner.trim() || null,
          idealClient: idealClient.trim() || null,
          businessUrl: businessUrl.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Could not save profile")
      }
      // Auto-suggest subdomain from business name if empty.
      if (!subdomain && businessName.trim()) {
        setSubdomain(deriveSubdomain(businessName))
      }
      await setStep("branding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  async function saveBranding() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/onboarding/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandColor: brandColor || null,
          tagline: tagline.trim() || null,
          logoUrl: logoUrl.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Could not save branding")
      }
      await setStep("site")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  async function provisionSite() {
    setBusy(true)
    setSiteError(null)
    setError(null)
    try {
      const res = await fetch("/api/portal/welcome/provision-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          businessName: businessName.trim() || "Your Agency",
          brandColor: brandColor || undefined,
          tagline: tagline.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
        }),
      })
      if (res.status === 409) {
        setSiteError("That subdomain is taken — try another.")
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Could not provision site")
      }
      setSiteProvisioned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provision failed")
    } finally {
      setBusy(false)
    }
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/portal/onboarding/upload", {
        method: "POST",
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "Upload failed")
      }
      setLogoUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLogoUploading(false)
    }
  }

  async function finishWizard() {
    setBusy(true)
    try {
      await fetch("/api/portal/welcome/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markComplete: true }),
      })
      // Sidebar credit badge may have changed during scout — nudge it.
      window.dispatchEvent(new Event(CREDIT_BALANCE_EVENT))
      router.push("/portal/dashboard")
    } finally {
      setBusy(false)
    }
  }

  async function skipForNow() {
    setBusy(true)
    try {
      await fetch("/api/portal/welcome/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markSkipped: true }),
      })
      router.push("/portal/dashboard")
    } finally {
      setBusy(false)
    }
  }

  // -------- step body renderers ---------

  function renderStep() {
    switch (step) {
      case "intro":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome to the AI Operator Collective
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                In the next 5 minutes we&apos;ll set up your branded site, scout
                your first leads, and put real numbers on your dashboard. You
                can skip any step.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto pt-2">
              {STEP_ORDER.slice(1, -1).map((s) => {
                const Icon = STEP_META[s].icon
                return (
                  <div
                    key={s}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-left"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-foreground">
                      {STEP_META[s].label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setStep("profile")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
              >
                Let&apos;s go <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={skipForNow}
                className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
            </div>
          </div>
        )

      case "profile":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Tell us about your business
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                This populates your branded site, proposals, and emails. You
                can edit any of this later in Settings.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Business name"
                value={businessName}
                onChange={setBusinessName}
                placeholder="Acme AI Consulting"
              />
              <Field
                label="Industry / niche"
                value={niche}
                onChange={setNiche}
                placeholder="HVAC, dental, e-commerce…"
              />
            </div>
            <Field
              label="One-line description"
              value={oneLiner}
              onChange={setOneLiner}
              placeholder="I help regional law firms cut document review by 60% with AI."
            />
            <Field
              label="Ideal client"
              value={idealClient}
              onChange={setIdealClient}
              placeholder="10-50 person professional services firms with repetitive workflows."
              textarea
            />
            <Field
              label="Existing website (optional)"
              value={businessUrl}
              onChange={setBusinessUrl}
              placeholder="https://your-current-site.com"
            />
            {error && <ErrorBox>{error}</ErrorBox>}
            <StepFooter
              onBack={() => setStep("intro")}
              onNext={saveProfile}
              nextDisabled={busy || businessName.trim().length === 0}
              nextLabel={busy ? "Saving…" : "Continue"}
              onSkip={skipForNow}
            />
          </div>
        )

      case "branding":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Your brand
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Drives your portal accent, public site, and outbound emails.
              </p>
            </div>
            <Field
              label="Tagline"
              value={tagline}
              onChange={setTagline}
              placeholder="AI-powered operations for the modern business"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Brand color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                  placeholder="#C4972A"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Logo
              </label>
              {logoUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-12 w-12 object-contain bg-black/5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{logoUrl}</p>
                  </div>
                  <button
                    onClick={() => setLogoUrl("")}
                    className="p-1 rounded hover:bg-surface"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center px-4 py-6 rounded-lg border border-dashed border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer">
                  {logoUploading
                    ? "Uploading…"
                    : "Click to upload (PNG, JPG, WebP, SVG)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadLogo(f)
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {error && <ErrorBox>{error}</ErrorBox>}
            <StepFooter
              onBack={() => setStep("profile")}
              onNext={saveBranding}
              nextDisabled={busy}
              nextLabel={busy ? "Saving…" : "Continue"}
              onSkip={skipForNow}
            />
          </div>
        )

      case "site":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Claim your subdomain
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your branded portal lives at
                <span className="font-mono text-primary"> [you]</span>
                .aioperatorcollective.com — clients sign in here, see your
                logo + colors, never see ours.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subdomain
              </label>
              <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                <input
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                        .slice(0, 40),
                    )
                  }
                  placeholder="your-agency"
                  className="flex-1 px-3 py-2 text-sm font-mono bg-transparent focus:outline-none"
                />
                <span className="px-3 py-2 text-xs text-muted-foreground bg-surface/50 border-l border-border">
                  .aioperatorcollective.com
                </span>
              </div>
              {siteError && (
                <p className="text-xs text-destructive">{siteError}</p>
              )}
            </div>
            {siteProvisioned && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">
                    Site ready at{" "}
                    <span className="font-mono text-primary">
                      {subdomain}.aioperatorcollective.com
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Unpublished by default — flip Publish in Settings when
                    you&apos;re ready for traffic.
                  </p>
                </div>
              </div>
            )}
            {error && <ErrorBox>{error}</ErrorBox>}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("branding")}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={skipForNow}
                  className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </button>
                {siteProvisioned ? (
                  <button
                    onClick={() => setStep("scout")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={provisionSite}
                    disabled={busy || subdomain.length < 3}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Provisioning…" : "Claim my site"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )

      case "scout":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Find your first 5 leads — live
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                We&apos;ll pull real businesses from Google Maps + import them
                straight into your CRM. Costs 1 credit; you have plenty.
              </p>
            </div>
            <ScoutDemoStep
              defaultLocation={scoutLocation}
              defaultBusinessType={scoutBusinessType}
              onComplete={() => {
                window.dispatchEvent(new Event(CREDIT_BALANCE_EVENT))
                void setStep("connections")
              }}
              onSkip={() => setStep("connections")}
            />
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("site")}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </div>
          </div>
        )

      case "connections":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Connect your tools (optional)
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Hook up the things you already use so the platform can post,
                book, and send on your behalf. All optional — skip and come
                back any time.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <ConnectCard
                title="Calendar booking page"
                description="So leads can book discovery calls directly from your branded site."
                cta="Set up in Settings"
                href="/portal/settings"
              />
              <ConnectCard
                title="Mighty Networks community"
                description="Join the operator community to learn from peers and unlock weekly plays."
                cta="Open community"
                href="/portal/settings/mighty"
              />
              <ConnectCard
                title="Sending domain"
                description="Send sequences from your-domain.com instead of the platform default."
                cta="Configure domain"
                href="/portal/settings/sending-domain"
              />
              <ConnectCard
                title="API + webhooks"
                description="Pipe deals + events into Zapier, n8n, your stack."
                cta="Get API keys"
                href="/portal/settings/api"
              />
            </div>
            {error && <ErrorBox>{error}</ErrorBox>}
            <StepFooter
              onBack={() => setStep("scout")}
              onNext={() => setStep("done")}
              nextLabel="Continue"
              nextDisabled={false}
              onSkip={skipForNow}
            />
          </div>
        )

      case "done":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                You&apos;re set up.
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your site is live, your first leads are in your CRM, and your
                portal is branded. Head to the dashboard to keep building.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto text-left">
              <NextLink
                href="/portal/crm"
                title="Open your CRM"
                description="See the leads we just imported."
              />
              <NextLink
                href="/portal/website"
                title="Edit your site"
                description="Tune copy, sections, publish to the world."
              />
              <NextLink
                href="/portal/marketplace"
                title="Add features"
                description="Voice agent, chatbot, inbox warmup, more."
              />
              <NextLink
                href="/portal/playbooks"
                title="Run a play"
                description="Battle-tested workflows you can copy."
              />
            </div>
            <button
              onClick={finishWizard}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Finishing…" : "Go to dashboard"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress rail */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          <span>
            Step {currentIdx + 1} of {STEP_ORDER.length} ·{" "}
            {STEP_META[step].label}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 md:p-8">
        {renderStep()}
      </div>
    </div>
  )
}

// -------- helpers ---------

function deriveSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/30 rounded-lg px-3 py-2">
      {children}
    </p>
  )
}

function StepFooter({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  onSkip,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled: boolean
  onSkip: () => void
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={onSkip}
          className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ConnectCard({
  title,
  description,
  cta,
  href,
}: {
  title: string
  description: string
  cta: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:border-primary/40 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span className="text-xs font-semibold text-primary shrink-0 ml-3">
        {cta} →
      </span>
    </a>
  )
}

function NextLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-border bg-background p-3 hover:border-primary/40 transition-colors"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </a>
  )
}
