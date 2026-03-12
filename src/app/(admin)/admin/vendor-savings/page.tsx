import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Clock,
  Circle,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorComparisonChart } from "@/components/admin/LeadMagnetCharts"
import { VendorAddDialog } from "@/components/admin/VendorAddDialog"

export const metadata = { title: "Vendor Savings" }

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  completed: {
    label: "Deployed",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    icon: CheckCircle2,
  },
  deployed: {
    label: "Deployed",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    icon: CheckCircle2,
  },
  ready: {
    label: "Ready",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    icon: Clock,
  },
  not_started: {
    label: "Planned",
    color: "text-muted-foreground bg-muted border-border",
    icon: Circle,
  },
}

export default async function AdminVendorSavingsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  let vendors: Awaited<ReturnType<typeof db.vendorTracker.findMany>> = []
  let dbError = false

  try {
    vendors = await db.vendorTracker.findMany({ orderBy: { projectedSavings: "desc" } })
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Savings Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track internal replacements of paid vendors with AI-built alternatives
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No vendors tracked yet. Add your first vendor to start tracking savings.
          </p>
          <div className="mt-4 flex justify-center">
            <VendorAddDialog />
          </div>
        </div>
      </div>
    )
  }

  const totalMonthly = vendors.reduce((s, v) => s + v.monthlyCost, 0)
  const totalProjected = vendors.reduce((s, v) => s + v.projectedSavings, 0)
  const totalActual = vendors.reduce(
    (s, v) =>
      ["completed", "deployed"].includes(v.replacementStatus) ? s + v.actualSavings : s,
    0
  )

  // Next highest-impact replacement not yet deployed
  const nextBest = vendors.find(
    (v) => !["completed", "deployed"].includes(v.replacementStatus)
  )

  // Chart data: vendor vs replacement cost (monthlyCost - projectedSavings as replacement estimate)
  const chartData = vendors.slice(0, 8).map((v) => ({
    vendor:
      v.vendorName.length > 12 ? v.vendorName.slice(0, 11) + "…" : v.vendorName,
    current: v.monthlyCost,
    replacement: Math.max(0, v.monthlyCost - v.projectedSavings),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Savings Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track internal replacements of paid vendors with AI-built alternatives
          </p>
        </div>
        <VendorAddDialog />
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No vendors tracked yet. Add your first vendor to start tracking savings.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">Monthly Vendor Spend</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <DollarSign className="h-4 w-4 text-red-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground font-mono">
                ${totalMonthly.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">Projected Monthly Savings</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                  <TrendingDown className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground font-mono">
                ${totalProjected.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMonthly > 0
                  ? `${Math.round((totalProjected / totalMonthly) * 100)}% of total spend`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">Actual Savings Realized</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400 font-mono">
                ${totalActual.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Saving ${totalActual.toLocaleString()} of ${totalProjected.toLocaleString()} projected
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Cost Comparison by Vendor
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Red = current cost &middot; Green = estimated cost after replacement
            </p>
            <VendorComparisonChart data={chartData} />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Vendor Replacement Pipeline
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Vendor",
                      "Monthly Cost",
                      "AIMS Replacement",
                      "Status",
                      "Projected Savings",
                      "Actual Savings",
                      "Notes",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => {
                    const status =
                      STATUS_CONFIG[v.replacementStatus] ?? STATUS_CONFIG.not_started!
                    const StatusIcon = status.icon
                    return (
                      <tr
                        key={v.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-foreground">
                            ${v.monthlyCost.toLocaleString()}/mo
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {v.replacementName ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border",
                              status.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-sm font-mono font-semibold",
                              v.projectedSavings > 0 ? "text-green-400" : "text-muted-foreground"
                            )}
                          >
                            {v.projectedSavings > 0
                              ? `$${v.projectedSavings.toLocaleString()}/mo`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-sm font-mono font-semibold",
                              v.actualSavings > 0 ? "text-green-400" : "text-muted-foreground"
                            )}
                          >
                            {v.actualSavings > 0
                              ? `$${v.actualSavings.toLocaleString()}/mo`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-xs text-muted-foreground truncate block">
                            {v.notes ?? "—"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insight card */}
          {nextBest && (
            <div className="rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5 p-5 flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-[#DC2626]">Next highest-impact replacement: </span>
                <span className="font-semibold">{nextBest.vendorName}</span> at{" "}
                <span className="font-semibold text-green-400">
                  ${nextBest.projectedSavings.toLocaleString()}/mo savings
                </span>
                . Currently{" "}
                {STATUS_CONFIG[nextBest.replacementStatus]?.label.toLowerCase() ??
                  nextBest.replacementStatus.replace(/_/g, " ")}
                .
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
