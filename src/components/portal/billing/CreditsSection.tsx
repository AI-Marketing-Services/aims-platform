import Link from "next/link"
import { Sparkles, ArrowUpRight, History } from "lucide-react"
import { db } from "@/lib/db"
import { PLAN_LABELS, PLAN_GRANTS } from "@/lib/enrichment/credits/pricing"
import { CreditTopupButton } from "./CreditTopupButton"

export async function CreditsSection({ userId }: { userId: string }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      creditBalance: true,
      creditPlanTier: true,
      creditGrantedAt: true,
    },
  })
  if (!user) return null

  // Last 25 transactions — full history viewable from /portal/billing/credits
  const recent = await db.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25,
  })

  const planLabel = PLAN_LABELS[user.creditPlanTier] ?? user.creditPlanTier
  const planGrant = PLAN_GRANTS[user.creditPlanTier] ?? 0
  const lowBalance = user.creditBalance < 50

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Enrichment credits
        </h2>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Balance + plan summary */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Available
            </p>
            <p
              className={`text-3xl font-bold leading-none ${
                lowBalance ? "text-amber-500" : "text-foreground"
              }`}
            >
              {user.creditBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ~{Math.floor(user.creditBalance / 80)} full enrichments worth
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Plan
            </p>
            <p className="text-3xl font-bold text-foreground leading-none">{planLabel}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {planGrant > 0
                ? `${planGrant.toLocaleString()} credits / month`
                : "No monthly grant"}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end justify-between">
            <CreditTopupButton />
            {lowBalance && (
              <p className="text-[11px] text-amber-500 md:text-right">
                Low balance — top up before your next Scout import.
              </p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        {recent.length > 0 && (
          <div className="border-t border-border">
            <div className="px-5 py-3 flex items-center justify-between bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3 w-3" />
                Recent activity
              </p>
              <Link
                href="/portal/billing/credits"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recent.slice(0, 6).map((t) => (
                <li key={t.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-foreground">{labelForReason(t.reason)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        t.amount > 0 ? "text-emerald-500" : "text-foreground"
                      }`}
                    >
                      {t.amount > 0 ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-16 text-right">
                      {t.balanceAfter.toLocaleString()} after
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recent.length === 0 && (
          <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground text-center">
            No credit activity yet. Run an Enrich on a Deal to see your first
            transaction here.
          </div>
        )}
      </div>
    </section>
  )
}

function labelForReason(reason: string): string {
  switch (reason) {
    case "trial-grant":
      return "Trial credits granted"
    case "monthly-grant":
      return "Monthly credit refill"
    case "topup-purchase":
      return "Credit top-up"
    case "enrichment-debit":
      return "Lead enrichment"
    case "places-search":
      return "Scout discovery"
    case "refund-error":
      return "Refund (failed step)"
    case "admin-adjustment":
      return "Admin adjustment"
    default:
      return reason
  }
}
