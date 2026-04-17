import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { CloseSyncButton } from "./CloseSyncButton"
import { CLOSE_AOC_VALUE } from "@/lib/close"

export const dynamic = "force-dynamic"

export default async function AdminClosePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const [totalWithClose, recentSync, totalDeals, recentCloseActivity] =
    await Promise.all([
      db.deal.count({ where: { closeLeadId: { not: null } } }),
      // logCronExecution writes to apiCostLog with provider=cron + model=<jobName>.
      db.apiCostLog
        .findFirst({
          where: { provider: "cron", model: "close-sync" },
          orderBy: { createdAt: "desc" },
        })
        .catch(() => null),
      db.deal.count(),
      db.dealActivity.findMany({
        where: {
          OR: [
            { metadata: { path: ["source"], equals: "close_sync" } },
            { metadata: { path: ["source"], equals: "close_webhook" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          deal: { select: { id: true, contactName: true, contactEmail: true } },
        },
      }),
    ])

  const configured = Boolean(process.env.CLOSE_API_KEY)
  const webhookConfigured = Boolean(process.env.CLOSE_WEBHOOK_SECRET)

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Close CRM" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Close CRM Integration</h1>
        <p className="text-muted-foreground">
          Two-way sync with the Vendingpreneurs Close workspace, filtered to
          our AOC partition. Every lead tagged{" "}
          <code className="text-primary text-sm px-1.5 py-0.5 bg-primary/10 rounded">
            BTC Business Line = {CLOSE_AOC_VALUE}
          </code>{" "}
          is mirrored into this CRM. Vending / Ben Kelly lines are never touched.
        </p>
      </div>

      {/* Config status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <ConfigTile
          label="API Connection"
          value={configured ? "Connected" : "Missing API key"}
          ok={configured}
        />
        <ConfigTile
          label="Webhook"
          value={webhookConfigured ? "Configured" : "Missing webhook secret"}
          ok={webhookConfigured}
        />
        <ConfigTile
          label="Deals linked to Close"
          value={`${totalWithClose} / ${totalDeals}`}
          ok={totalWithClose > 0}
        />
      </div>

      {/* Manual sync */}
      <section className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Manual sync</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pulls every AOC-tagged lead from Close and upserts them into
              our CRM right now. Hourly cron does this automatically; use
              this when you just added a field or need to reconcile.
            </p>
          </div>
          <CloseSyncButton />
        </div>
        {recentSync && (
          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <p className="font-mono">
              Last cron: {new Date(recentSync.createdAt).toLocaleString()} ·{" "}
              <span
                className={
                  recentSync.endpoint === "success"
                    ? "text-emerald-700"
                    : "text-primary"
                }
              >
                {recentSync.endpoint}
              </span>
            </p>
            <p className="mt-1 text-foreground font-medium">
              {((recentSync.metadata as { details?: string } | null)?.details) ?? "—"}
            </p>
          </div>
        )}
      </section>

      {/* Recent Close-sourced activity */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Recent sync + webhook events
        </h2>
        {recentCloseActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No Close-sourced activity yet. Hit Sync now or wait for the
            hourly cron; events will show up once a Close lead triggers
            a stage change or a new deal appears.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentCloseActivity.map((a) => {
              const meta = (a.metadata ?? {}) as Record<string, unknown>
              const source = (meta.source as string) ?? "close"
              return (
                <li key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Link
                        href={`/admin/crm/${a.deal.id}`}
                        className="text-primary hover:underline"
                      >
                        {a.deal.contactName}
                      </Link>{" "}
                      · {a.deal.contactEmail} ·{" "}
                      <span className="font-mono text-[10px] uppercase tracking-wider">
                        {source.replace("_", " ")}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 text-xs text-muted-foreground">
        <p>
          Docs:{" "}
          <a
            href="https://developer.close.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            developer.close.com
          </a>
          . Integration notes live at{" "}
          <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">
            docs/CLOSE_INTEGRATION.md
          </code>
          .
        </p>
      </div>
    </div>
  )
}

function ConfigTile({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-primary/30 bg-primary/5 text-primary"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  )
}
