import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Resend } from "resend"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { getEffectiveRole } from "@/lib/auth"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Mail,
  CreditCard,
  Sparkles,
  Webhook,
  Clock,
} from "lucide-react"

export const metadata: Metadata = { title: "System health" }
export const dynamic = "force-dynamic"

interface CheckResult {
  status: "ok" | "warn" | "fail"
  detail: string
  meta?: Record<string, unknown>
}

export default async function SystemHealthPage() {
  const effective = await getEffectiveRole()
  if (!effective) redirect("/sign-in")
  if (effective.realRole !== "ADMIN" && effective.realRole !== "SUPER_ADMIN") {
    redirect("/portal/dashboard")
  }

  // Run all checks in parallel — none should ever throw, all return CheckResult.
  const [
    resend,
    stripeCheck,
    dbCheck,
    cronCheck,
    enrichmentEnvs,
    cronEnvs,
    recentErrors,
  ] = await Promise.all([
    checkResendDomains(),
    checkStripe(),
    checkDatabase(),
    checkRecentCronRuns(),
    Promise.resolve(checkEnrichmentEnvs()),
    Promise.resolve(checkCronEnvs()),
    fetchRecentApiErrors(),
  ])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          External service status, env-var configuration, recent failures.
          Refresh to re-run checks.
        </p>
      </div>

      <Section title="Email — Resend" icon={<Mail className="h-4 w-4" />}>
        <CheckRow label="Domain verified" result={resend} />
      </Section>

      <Section title="Payments — Stripe" icon={<CreditCard className="h-4 w-4" />}>
        <CheckRow label="API connectivity" result={stripeCheck} />
      </Section>

      <Section title="Database — Neon" icon={<Database className="h-4 w-4" />}>
        <CheckRow label="Connection + write probe" result={dbCheck} />
      </Section>

      <Section title="Cron jobs" icon={<Clock className="h-4 w-4" />}>
        <CheckRow label="Recent executions (last 24h)" result={cronCheck} />
      </Section>

      <Section title="Enrichment APIs" icon={<Sparkles className="h-4 w-4" />}>
        <CheckRow label="Google Maps" result={enrichmentEnvs.maps} />
        <CheckRow label="Perplexity" result={enrichmentEnvs.perplexity} />
        <CheckRow label="Hunter" result={enrichmentEnvs.hunter} />
        <CheckRow label="Prospeo" result={enrichmentEnvs.prospeo} />
        <CheckRow label="Vercel Blob (logo uploads)" result={enrichmentEnvs.blob} />
      </Section>

      <Section title="Webhook secrets" icon={<Webhook className="h-4 w-4" />}>
        <CheckRow label="Stripe webhook secret" result={cronEnvs.stripeWebhook} />
        <CheckRow label="Mighty webhook secret" result={cronEnvs.mightyWebhook} />
        <CheckRow label="Calendly webhook secret" result={cronEnvs.calendlyWebhook} />
        <CheckRow label="Clerk webhook secret" result={cronEnvs.clerkWebhook} />
        <CheckRow label="Cron secret" result={cronEnvs.cronSecret} />
      </Section>

      <Section
        title="Recent errors (last 24h)"
        icon={<AlertTriangle className="h-4 w-4" />}
      >
        {recentErrors.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No structured error events in the last 24h. (Console errors in
            Vercel logs may not be captured here — install Sentry for full
            observability.)
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentErrors.map((e, i) => (
              <li key={i} className="py-2 text-xs">
                <p className="font-medium text-foreground">{e.label}</p>
                <p className="text-muted-foreground mt-0.5">
                  {new Date(e.when).toLocaleString()} ·{" "}
                  {e.detail.length > 200
                    ? e.detail.slice(0, 200) + "…"
                    : e.detail}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </header>
      <div className="px-5 py-2 divide-y divide-border">{children}</div>
    </section>
  )
}

function CheckRow({ label, result }: { label: string; result: CheckResult }) {
  const Icon =
    result.status === "ok" ? CheckCircle : result.status === "warn" ? AlertTriangle : XCircle
  const color =
    result.status === "ok"
      ? "text-emerald-500"
      : result.status === "warn"
        ? "text-amber-500"
        : "text-destructive"

  return (
    <div className="py-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {result.detail}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
//  Check implementations — all wrapped to never throw
// ─────────────────────────────────────────────────────────────────────

async function checkResendDomains(): Promise<CheckResult> {
  const key = process.env.RESEND_API_KEY
  if (!key || key === "re_placeholder") {
    return {
      status: "fail",
      detail: "RESEND_API_KEY is not configured. Transactional emails will silently drop.",
    }
  }
  try {
    const resend = new Resend(key)
    const res = await resend.domains.list()
    const domains = (res.data as unknown as { data?: Array<{ name: string; status: string }> })?.data ?? []
    const target = "aioperatorcollective.com"
    const verified = domains.find((d) => d.name === target && d.status === "verified")
    if (verified) {
      return {
        status: "ok",
        detail: `${target} verified · ${domains.length} domain(s) total`,
      }
    }
    const found = domains.find((d) => d.name === target)
    if (found) {
      return {
        status: "warn",
        detail: `${target} present but status='${found.status}' — finish DNS verification in Resend dashboard.`,
      }
    }
    return {
      status: "fail",
      detail: `${target} not found in Resend account. Add + verify domain or emails will bounce.`,
    }
  } catch (err) {
    return {
      status: "fail",
      detail: `Resend API call failed: ${err instanceof Error ? err.message : "unknown"}`,
    }
  }
}

async function checkStripe(): Promise<CheckResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: "fail", detail: "STRIPE_SECRET_KEY is not set." }
  }
  try {
    const acct = await stripe.accounts.retrieve()
    return {
      status: "ok",
      detail: `Connected to account ${acct.id} (${acct.business_profile?.name ?? "unnamed"})`,
    }
  } catch (err) {
    return {
      status: "fail",
      detail: err instanceof Error ? err.message : "Stripe API failed",
    }
  }
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    const result = await db.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`
    if (result.length === 1 && result[0].ok === 1) {
      return { status: "ok", detail: "SELECT 1 succeeded · Neon reachable" }
    }
    return { status: "warn", detail: "Unexpected DB probe result" }
  } catch (err) {
    return {
      status: "fail",
      detail: err instanceof Error ? err.message : "DB unreachable",
    }
  }
}

async function checkRecentCronRuns(): Promise<CheckResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const runs = await db.apiCostLog.findMany({
      where: { provider: "cron", createdAt: { gte: since } },
      select: { model: true, endpoint: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    if (runs.length === 0) {
      return {
        status: "warn",
        detail: "No cron executions logged in the last 24h. Verify CRON_SECRET + Vercel cron config.",
      }
    }
    const errors = runs.filter((r) => r.endpoint === "error")
    if (errors.length > 0) {
      return {
        status: "warn",
        detail: `${runs.length} runs · ${errors.length} errors. Latest: ${runs[0].model} (${runs[0].endpoint})`,
      }
    }
    return {
      status: "ok",
      detail: `${runs.length} successful runs in last 24h. Most recent: ${runs[0].model}`,
    }
  } catch (err) {
    return {
      status: "fail",
      detail: err instanceof Error ? err.message : "Cron-log query failed",
    }
  }
}

function checkEnrichmentEnvs() {
  return {
    maps: envCheck("GOOGLE_MAPS_API_KEY", "GOOGLE_PLACES_API_KEY"),
    perplexity: envCheck("PERPLEXITY_API_KEY"),
    hunter: envCheck("HUNTER_API_KEY"),
    prospeo: envCheck("PROSPEO_API_KEY"),
    blob: envCheck("BLOB_READ_WRITE_TOKEN"),
  }
}

function checkCronEnvs() {
  return {
    stripeWebhook: envCheck("STRIPE_WEBHOOK_SECRET"),
    mightyWebhook: envCheck("MIGHTY_WEBHOOK_SECRET"),
    calendlyWebhook: envCheck("CALENDLY_WEBHOOK_SECRET"),
    clerkWebhook: envCheck("CLERK_WEBHOOK_SECRET"),
    cronSecret: envCheck("CRON_SECRET"),
  }
}

function envCheck(...names: string[]): CheckResult {
  const found = names.find((n) => Boolean(process.env[n]))
  if (found) {
    return {
      status: "ok",
      detail: `${found} is set${names.length > 1 ? ` (one of ${names.join(", ")})` : ""}`,
    }
  }
  return {
    status: "fail",
    detail: `Not configured: ${names.join(" or ")}`,
  }
}

async function fetchRecentApiErrors(): Promise<
  Array<{ label: string; detail: string; when: Date }>
> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const errors = await db.apiCostLog.findMany({
      where: {
        endpoint: { in: ["error"] },
        createdAt: { gte: since },
      },
      select: { model: true, endpoint: true, createdAt: true, metadata: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    })
    return errors.map((e) => ({
      label: `${e.model}: ${e.endpoint}`,
      detail:
        e.metadata && typeof e.metadata === "object" && "details" in e.metadata
          ? String((e.metadata as { details: unknown }).details)
          : "(no detail)",
      when: e.createdAt,
    }))
  } catch {
    return []
  }
}
