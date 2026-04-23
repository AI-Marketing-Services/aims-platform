import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { FileText, DollarSign, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"
export const metadata = { title: "Invoice Tracking — Admin" }

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
  OVERDUE: "bg-red-50 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-400",
}

async function getInvoiceData() {
  const invoices = await db.clientInvoice.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          memberProfile: { select: { businessName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0)
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0)
  const totalSent = invoices.filter((i) => i.status === "SENT").reduce((s, i) => s + i.total, 0)
  const totalOverdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0)

  const byStatus = {
    DRAFT: invoices.filter((i) => i.status === "DRAFT").length,
    SENT: invoices.filter((i) => i.status === "SENT").length,
    PAID: invoices.filter((i) => i.status === "PAID").length,
    OVERDUE: invoices.filter((i) => i.status === "OVERDUE").length,
    CANCELLED: invoices.filter((i) => i.status === "CANCELLED").length,
  }

  // Per-member breakdown
  const memberMap = new Map<string, {
    userId: string
    name: string
    email: string
    invoiceCount: number
    totalInvoiced: number
    totalPaid: number
    totalOutstanding: number
    overdueCount: number
  }>()

  for (const inv of invoices) {
    const key = inv.userId
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        userId: inv.userId,
        name: inv.user.memberProfile?.businessName ?? inv.user.name ?? inv.user.email,
        email: inv.user.email,
        invoiceCount: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        overdueCount: 0,
      })
    }
    const m = memberMap.get(key)!
    m.invoiceCount++
    m.totalInvoiced += inv.total
    if (inv.status === "PAID") m.totalPaid += inv.total
    if (inv.status === "SENT" || inv.status === "OVERDUE") m.totalOutstanding += inv.total
    if (inv.status === "OVERDUE") m.overdueCount++
  }

  const memberBreakdown = [...memberMap.values()].sort((a, b) => b.totalInvoiced - a.totalInvoiced)

  return { invoices, totalInvoiced, totalPaid, totalSent, totalOverdue, byStatus, memberBreakdown }
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export default async function AdminInvoicesPage() {
  await requireAdmin()
  const {
    invoices,
    totalInvoiced,
    totalPaid,
    totalSent,
    totalOverdue,
    byStatus,
    memberBreakdown,
  } = await getInvoiceData()

  return (
    <div className="max-w-6xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Invoice Tracking" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Invoice Tracking</h1>
        <p className="text-muted-foreground text-sm">
          All client invoices across all portal members — {invoices.length} total
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(totalInvoiced)}</p>
          <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-1">{byStatus.PAID} paid invoices</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{fmt(totalSent)}</p>
          <p className="text-xs text-muted-foreground mt-1">{byStatus.SENT} sent, awaiting payment</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(totalOverdue)}</p>
          <p className="text-xs text-muted-foreground mt-1">{byStatus.OVERDUE} overdue invoices</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Invoice list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">All Invoices</p>
          </div>
          {invoices.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Member</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Recipient</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-foreground font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{inv.title}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-foreground">
                          {inv.user.memberProfile?.businessName ?? inv.user.name ?? inv.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {inv.recipientName ?? inv.recipientCompany ?? inv.recipientEmail ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-foreground">{fmt(inv.total)}</p>
                        {inv.taxAmount > 0 && (
                          <p className="text-[10px] text-muted-foreground">{fmt(inv.taxAmount)} tax</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                        </p>
                        {inv.paidAt && (
                          <p className="text-[10px] text-emerald-600">
                            Paid {formatDistanceToNow(new Date(inv.paidAt), { addSuffix: true })}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-member breakdown */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">By Member</p>
          </div>
          {memberBreakdown.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No data</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {memberBreakdown.map((m) => (
                <div key={m.userId} className="px-5 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-sm font-bold text-foreground shrink-0">{fmt(m.totalInvoiced)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-emerald-600 font-semibold">{fmt(m.totalPaid)} collected</span>
                    {m.totalOutstanding > 0 && (
                      <span className="text-blue-600">{fmt(m.totalOutstanding)} outstanding</span>
                    )}
                    {m.overdueCount > 0 && (
                      <span className="text-red-600 font-semibold">{m.overdueCount} overdue</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.invoiceCount} invoice{m.invoiceCount !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Status Distribution</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const).map((status) => (
            <div key={status} className="text-center">
              <p className={`text-lg font-bold ${
                status === "PAID" ? "text-emerald-600" :
                status === "OVERDUE" ? "text-red-600" :
                status === "SENT" ? "text-blue-600" :
                "text-muted-foreground"
              }`}>{byStatus[status]}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{status}</p>
            </div>
          ))}
        </div>
        {invoices.length > 0 && (
          <div className="mt-4 h-2 rounded-full overflow-hidden flex">
            {byStatus.PAID > 0 && (
              <div className="bg-emerald-500 h-full" style={{ width: `${(byStatus.PAID / invoices.length) * 100}%` }} />
            )}
            {byStatus.SENT > 0 && (
              <div className="bg-blue-400 h-full" style={{ width: `${(byStatus.SENT / invoices.length) * 100}%` }} />
            )}
            {byStatus.OVERDUE > 0 && (
              <div className="bg-red-500 h-full" style={{ width: `${(byStatus.OVERDUE / invoices.length) * 100}%` }} />
            )}
            {byStatus.DRAFT > 0 && (
              <div className="bg-muted h-full" style={{ width: `${(byStatus.DRAFT / invoices.length) * 100}%` }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
