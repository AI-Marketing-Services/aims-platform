import { redirect } from "next/navigation"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { ripenPendingCommissions } from "@/lib/commerce/commission"
import { DollarSign, AlertTriangle } from "lucide-react"

export const metadata = { title: "Commission Ledger", robots: { index: false } }
export const dynamic = "force-dynamic"

function fmt(cents: number): string {
  const sign = cents < 0 ? "-" : ""
  const abs = Math.abs(cents)
  return `${sign}$${(abs / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function AdminCommissionLedgerPage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  // Each render ripens any pending events whose clawback window has
  // passed. Cheap (single UPDATE) — keeps "payable" totals current
  // without a separate cron.
  await ripenPendingCommissions()

  const grouped = await db.commissionEvent.groupBy({
    by: ["resellerId", "status"],
    _sum: { amountCents: true },
  })

  type Totals = { pending: number; payable: number; paid: number; clawedBack: number }
  const byReseller = new Map<string, Totals>()
  for (const g of grouped) {
    const row =
      byReseller.get(g.resellerId) ?? { pending: 0, payable: 0, paid: 0, clawedBack: 0 }
    const sum = g._sum.amountCents ?? 0
    if (g.status === "pending") row.pending += sum
    else if (g.status === "payable") row.payable += sum
    else if (g.status === "paid") row.paid += sum
    else if (g.status === "clawed_back") row.clawedBack += sum
    byReseller.set(g.resellerId, row)
  }

  const resellerIds = Array.from(byReseller.keys())
  const resellers = await db.user.findMany({
    where: { id: { in: resellerIds } },
    select: {
      id: true,
      name: true,
      email: true,
      operatorSite: { select: { subdomain: true } },
    },
  })
  const resellerMap = new Map(resellers.map((r) => [r.id, r]))

  const platform: Totals = { pending: 0, payable: 0, paid: 0, clawedBack: 0 }
  for (const r of byReseller.values()) {
    platform.pending += r.pending
    platform.payable += r.payable
    platform.paid += r.paid
    platform.clawedBack += r.clawedBack
  }

  const ranked = Array.from(byReseller.entries())
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => b.payable + b.pending - (a.payable + a.pending))

  const recent = await db.commissionEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      reseller: { select: { email: true, name: true } },
      purchase: { select: { product: { select: { name: true, slug: true } } } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
          COMMERCE · COMMISSION LEDGER
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Commission Ledger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Append-only ledger of every product-catalog commission earned by every reseller. Pending events ripen to payable after a 30-day clawback window. (For the legacy Dub.co/Referral commissions, see <Link href="/admin/commissions" className="underline">/admin/commissions</Link>.)
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Read-only ledger</p>
          <p className="text-muted-foreground mt-1">
            Payout execution waits for Stripe Connect onboarding (post legal sign-off). Until then, pay resellers manually via Stripe Dashboard and we&apos;ll add a &quot;mark paid&quot; admin action.
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat label="Pending" value={fmt(platform.pending)} hint="Within 30d clawback window" />
        <Stat label="Payable now" value={fmt(platform.payable)} hint="Ready to pay out" tone="good" />
        <Stat label="Paid out" value={fmt(platform.paid)} hint="Lifetime" />
        <Stat label="Clawed back" value={fmt(platform.clawedBack)} hint="From refunds" tone="warn" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Resellers ranked by owed</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Reseller</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Payable</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Clawback</th>
                <th className="px-4 py-3 text-right">Total earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranked.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No commission events yet. Events fire when an attributed Purchase is created.
                  </td>
                </tr>
              )}
              {ranked.map((r) => {
                const u = resellerMap.get(r.id)
                const total = r.pending + r.payable + r.paid + r.clawedBack
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u?.name ?? u?.email ?? r.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {u?.email}
                        {u?.operatorSite?.subdomain && (
                          <span className="ml-2 font-mono text-[10px] text-primary">
                            {u.operatorSite.subdomain}.aioperatorcollective.com
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(r.pending)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">
                      {fmt(r.payable)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {fmt(r.paid)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{fmt(r.clawedBack)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent commission events</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Reseller</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No events yet.
                  </td>
                </tr>
              )}
              {recent.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">{e.reseller.name ?? e.reseller.email}</td>
                  <td className="px-4 py-3 text-xs">{e.purchase.product.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{e.type}</td>
                  <td className={`px-4 py-3 text-right font-mono ${e.amountCents < 0 ? "text-amber-700" : ""}`}>
                    {fmt(e.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Need to dig deeper? <Link href="/admin/whitelabel" className="underline hover:text-primary">Whitelabel sites</Link> shows leads + attribution per reseller.
        </p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string
  value: string
  hint?: string
  tone?: "good" | "warn" | "neutral"
}) {
  const cls =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-foreground"
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold font-mono ${cls}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "text-primary bg-primary/10",
    payable: "text-emerald-700 bg-emerald-500/10",
    paid: "text-muted-foreground bg-muted",
    clawed_back: "text-amber-700 bg-amber-500/10",
    voided: "text-red-700 bg-red-500/10",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${cls[status] ?? "bg-muted"}`}>
      {status}
    </span>
  )
}
