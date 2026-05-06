import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreditCard, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { PLANS } from "@/lib/plans/registry"
import { PRE_GRANTED_EMAILS } from "@/lib/plans/grant"
import { PlansAdminClient } from "./PlansAdminClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Plans · Admin" }

export default async function AdminPlansPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  const users = await db.user.findMany({
    where: { role: { in: ["CLIENT", "RESELLER", "INTERN"] } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      planSlug: true,
      creditBalance: true,
      createdAt: true,
      _count: {
        select: { userEntitlements: { where: { revokedAt: null } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Plan distribution stats for the header.
  const stats = users.reduce(
    (acc, u) => {
      acc[u.planSlug] = (acc[u.planSlug] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Plans" },
        ]}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plans</h1>
            <p className="text-sm text-muted-foreground">
              Comp testers, change plans, audit who has what.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLANS.map((p) => (
          <div
            key={p.slug}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              {p.name}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats[p.slug] ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ${p.priceMonthly}/mo · {p.entitlements.length} features
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-comp list
          </p>
          <p className="text-2xl font-bold text-foreground">
            {Object.keys(PRE_GRANTED_EMAILS).length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            emails pre-granted on first login
          </p>
        </div>
      </div>

      <PlansAdminClient
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          planSlug: u.planSlug,
          creditBalance: u.creditBalance,
          entitlementCount: u._count.userEntitlements,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
