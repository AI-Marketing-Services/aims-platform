"use client"

import { DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react"

interface Commission {
  id: string
  amount: number
  percentage: number
  sourceAmount: number
  status: string
  createdAt: string
  paidAt: string | null
  approvedAt: string | null
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: {
    label: "Pending",
    className: "text-amber-400 bg-amber-900/20 border-amber-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    className: "text-blue-400 bg-blue-900/20 border-blue-800",
    icon: CheckCircle2,
  },
  PAID: {
    label: "Paid",
    className: "text-green-400 bg-green-900/15 border-green-800",
    icon: DollarSign,
  },
  REJECTED: {
    label: "Rejected",
    className: "text-red-400 bg-red-900/20 border-red-800",
    icon: XCircle,
  },
}

export function ResellerCommissionsClient({ commissions }: { commissions: Commission[] }) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (commissions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No commissions yet. Refer clients to start earning.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Commission History</h2>
      </div>
      <div className="divide-y divide-border">
        {commissions.map((c) => {
          const sc = statusConfig[c.status] ?? statusConfig.PENDING
          const StatusIcon = sc.icon

          return (
            <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {sc.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.percentage}% of ${c.sourceAmount.toLocaleString()} payment
                  {c.paidAt && ` - Paid ${formatDate(c.paidAt)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground font-mono">
                  ${c.amount.toFixed(2)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
