import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { FileText, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Send } from "lucide-react"
import type { ClientInvoiceStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

async function getInvoices(clerkId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!dbUser) return []

  return db.clientInvoice.findMany({
    where: { userId: dbUser.id },
    include: {
      lineItems: false,
      clientDeal: { select: { companyName: true, contactName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

function StatusBadge({ status }: { status: ClientInvoiceStatus }) {
  const config: Record<
    ClientInvoiceStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      label: "Draft",
      className: "bg-muted text-muted-foreground border border-border",
      icon: <FileText className="h-3 w-3" />,
    },
    SENT: {
      label: "Sent",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: <Send className="h-3 w-3" />,
    },
    PAID: {
      label: "Paid",
      className: "bg-green-50 text-green-700 border border-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-50 text-red-600 border border-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground border border-border",
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const { label, className, icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {icon}
      {label}
    </span>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

export default async function InvoicesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const invoices = await getInvoices(userId)

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Invoices</h1>
            <p className="text-xs text-muted-foreground">Create and send professional invoices to your clients</p>
          </div>
        </div>
        <Link
          href="/portal/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: String(invoices.length), sub: "all time" },
          {
            label: "Outstanding",
            value: formatCurrency(totalOutstanding, "USD"),
            sub: `${invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE").length} invoice(s)`,
          },
          {
            label: "Collected",
            value: formatCurrency(totalPaid, "USD"),
            sub: `${invoices.filter((i) => i.status === "PAID").length} paid`,
          },
          {
            label: "Drafts",
            value: String(invoices.filter((i) => i.status === "DRAFT").length),
            sub: "pending send",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No invoices yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your first invoice to get paid</p>
            <Link
              href="/portal/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Invoice #", "Client", "Status", "Total", "Due Date", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-semibold text-primary">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">
                        {invoice.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.clientDeal ? (
                        <div>
                          <p className="text-sm text-foreground">{invoice.clientDeal.companyName}</p>
                          {invoice.clientDeal.contactName && (
                            <p className="text-xs text-muted-foreground">{invoice.clientDeal.contactName}</p>
                          )}
                        </div>
                      ) : invoice.recipientName || invoice.recipientCompany ? (
                        <div>
                          <p className="text-sm text-foreground">
                            {invoice.recipientCompany ?? invoice.recipientName}
                          </p>
                          {invoice.recipientEmail && (
                            <p className="text-xs text-muted-foreground">{invoice.recipientEmail}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No client</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.dueAt ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {new Date(invoice.dueAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/portal/invoices/${invoice.id}`}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
