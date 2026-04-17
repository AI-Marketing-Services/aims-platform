import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DollarSign, Clock, CheckCircle2, Send } from "lucide-react"
import { CommissionsTable, type CommissionRow } from "@/components/admin/CommissionsTable"

export const metadata = { title: "Commissions" }

export default async function AdminCommissionsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const [commissions, summary] = await Promise.all([
    db.commission.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        referral: {
          select: {
            id: true,
            code: true,
            tier: true,
            referrer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    }),
    db.commission.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const totals = {
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  }
  const counts = {
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  }
  for (const s of summary) {
    const amount = s._sum.amount ?? 0
    const n = s._count.id
    if (s.status === "PENDING") {
      totals.pending = amount
      counts.pending = n
    } else if (s.status === "APPROVED") {
      totals.approved = amount
      counts.approved = n
    } else if (s.status === "PAID") {
      totals.paid = amount
      counts.paid = n
    } else if (s.status === "REJECTED") {
      totals.rejected = amount
      counts.rejected = n
    }
  }

  const rows: CommissionRow[] = commissions.map((c) => ({
    id: c.id,
    amount: c.amount,
    percentage: c.percentage,
    sourceAmount: c.sourceAmount,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    approvedAt: c.approvedAt?.toISOString() ?? null,
    paidAt: c.paidAt?.toISOString() ?? null,
    notes: c.notes,
    referral: {
      code: c.referral.code,
      tier: c.referral.tier,
      referrer: {
        name: c.referral.referrer.name,
        email: c.referral.referrer.email,
      },
    },
  }))

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partner Commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, approve, and mark commissions as paid. State flow: PENDING → APPROVED → PAID.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-in">
        {[
          {
            label: "Pending Review",
            value: fmt(totals.pending),
            sub: `${counts.pending} commissions`,
            icon: Clock,
            tone: "text-primary/70 bg-primary/5",
          },
          {
            label: "Approved (Owed)",
            value: fmt(totals.approved),
            sub: `${counts.approved} awaiting payout`,
            icon: CheckCircle2,
            tone: "text-primary bg-primary/10",
          },
          {
            label: "Paid All-Time",
            value: fmt(totals.paid),
            sub: `${counts.paid} transactions`,
            icon: Send,
            tone: "text-emerald-700 bg-emerald-50",
          },
          {
            label: "Rejected",
            value: fmt(totals.rejected),
            sub: `${counts.rejected} rejected`,
            icon: DollarSign,
            tone: "text-muted-foreground bg-muted/50",
          },
        ].map(({ label, value, sub, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 micro-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Commissions table */}
      <CommissionsTable rows={rows} />

      {/* Empty state hint */}
      {rows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-foreground font-medium">No commissions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Commissions are created automatically when a referred user&apos;s first invoice is paid.
          </p>
        </div>
      )}
    </div>
  )
}
