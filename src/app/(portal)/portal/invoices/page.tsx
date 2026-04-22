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
      className: "bg-[#1f2330] text-[#9CA3AF] border border-[#2a3040]",
      icon: <FileText className="h-3 w-3" />,
    },
    SENT: {
      label: "Sent",
      className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      icon: <Send className="h-3 w-3" />,
    },
    PAID: {
      label: "Paid",
      className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-500/10 text-red-400 border border-red-500/20",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-[#1f2330] text-[#6B7280] border border-[#2a3040]",
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
          <div className="h-10 w-10 rounded-lg bg-[#C4972A]/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-[#C4972A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F0EBE0]">Invoices</h1>
            <p className="text-xs text-[#9CA3AF]">Create and send professional invoices to your clients</p>
          </div>
        </div>
        <Link
          href="/portal/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#d4a730] transition-colors"
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
            className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-4"
          >
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-[#F0EBE0]">{stat.value}</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-[#C4972A]/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-[#C4972A]" />
            </div>
            <p className="text-sm font-semibold text-[#F0EBE0] mb-1">No invoices yet</p>
            <p className="text-xs text-[#9CA3AF] mb-4">Create your first invoice to get paid</p>
            <Link
              href="/portal/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#d4a730] transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2d3d]">
                  {["Invoice #", "Client", "Status", "Total", "Due Date", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d3d]">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#0f1620] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-semibold text-[#C4972A]">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5 max-w-[180px] truncate">
                        {invoice.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.clientDeal ? (
                        <div>
                          <p className="text-sm text-[#F0EBE0]">{invoice.clientDeal.companyName}</p>
                          {invoice.clientDeal.contactName && (
                            <p className="text-xs text-[#9CA3AF]">{invoice.clientDeal.contactName}</p>
                          )}
                        </div>
                      ) : invoice.recipientName || invoice.recipientCompany ? (
                        <div>
                          <p className="text-sm text-[#F0EBE0]">
                            {invoice.recipientCompany ?? invoice.recipientName}
                          </p>
                          {invoice.recipientEmail && (
                            <p className="text-xs text-[#9CA3AF]">{invoice.recipientEmail}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7280]">No client</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#F0EBE0]">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.dueAt ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-[#9CA3AF]" />
                          <span className="text-sm text-[#F0EBE0]">
                            {new Date(invoice.dueAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7280]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/portal/invoices/${invoice.id}`}
                        className="text-xs font-semibold text-[#C4972A] hover:text-[#d4a730] transition-colors opacity-0 group-hover:opacity-100"
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
