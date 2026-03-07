import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DollarSign, TrendingDown, Clock, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Vendor Savings" }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  completed: { label: "Replaced", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  not_started: { label: "Planned", color: "text-muted-foreground bg-muted border-border", icon: Circle },
}

export default async function AdminVendorSavingsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const vendors = await db.vendorTracker.findMany({ orderBy: { projectedSavings: "desc" } })

  const totalMonthly = vendors.reduce((s, v) => s + v.monthlyCost, 0)
  const totalProjected = vendors.reduce((s, v) => s + v.projectedSavings, 0)
  const totalActual = vendors.reduce((s, v) => s + v.actualSavings, 0)
  const replacedCount = vendors.filter((v) => v.replacementStatus === "completed").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendor Savings Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track internal replacements of paid vendors with AI-built alternatives
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Monthly Vendor Spend", value: `$${totalMonthly.toLocaleString()}`, icon: DollarSign },
          { label: "Projected Monthly Savings", value: `$${totalProjected.toLocaleString()}`, icon: TrendingDown },
          { label: "Actual Monthly Savings", value: `$${totalActual.toLocaleString()}`, icon: CheckCircle2 },
          { label: "Vendors Replaced", value: `${replacedCount} / ${vendors.length}`, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Vendor Replacement Pipeline</h2>
        </div>
        {vendors.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No vendors tracked yet. Seed the database to populate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Vendor", "Category", "Monthly Cost", "Replacement", "Status", "Projected Savings", "Payback"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const status = STATUS_CONFIG[v.replacementStatus] ?? STATUS_CONFIG.not_started
                  const StatusIcon = status.icon
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground capitalize">{v.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-foreground">${v.monthlyCost.toLocaleString()}/mo</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{v.replacementName ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-mono font-semibold", v.projectedSavings > 0 ? "text-green-400" : "text-muted-foreground")}>
                          {v.projectedSavings > 0 ? `$${v.projectedSavings.toLocaleString()}/mo` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {v.paybackMonths ? `${v.paybackMonths}mo` : "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
