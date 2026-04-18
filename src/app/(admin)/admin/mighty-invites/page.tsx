import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { AddDealDialog } from "@/components/admin/AddDealDialog"
import { MightyInviteAuditTable, type AuditRow } from "./MightyInviteAuditTable"

export const dynamic = "force-dynamic"

export default async function MightyInviteAuditPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  // Pull invites + any consult-done deals that never got invited.
  // Without the second query, the audit only shows "things that were
  // tried" — missing the "never attempted" bucket is how leads rot.
  const [invites, awaitingInviteDeals] = await Promise.all([
    db.mightyInvite.findMany({
      orderBy: { sentAt: "desc" },
      include: {
        deal: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            stage: true,
            leadScoreTier: true,
          },
        },
      },
    }),
    db.deal.findMany({
      where: {
        stage: { in: ["CONSULT_BOOKED", "CONSULT_COMPLETED"] },
        mightyInvites: { none: {} },
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        stage: true,
        leadScoreTier: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  const rows: AuditRow[] = invites.map((inv) => ({
    id: inv.id,
    dealId: inv.dealId,
    contactName: inv.deal?.contactName ?? "—",
    email: inv.email,
    dealStage: inv.deal?.stage ?? null,
    leadScoreTier: inv.deal?.leadScoreTier ?? null,
    planName: inv.planName ?? `plan ${inv.planId}`,
    status: inv.status,
    errorMessage: inv.errorMessage ?? null,
    mightyInviteId: inv.mightyInviteId ?? null,
    sentAt: inv.sentAt.toISOString(),
    resentAt: inv.resentAt ? inv.resentAt.toISOString() : null,
    acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
  }))

  const counts = {
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent").length,
    pending: rows.filter((r) => r.status === "pending").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    failed: rows.filter((r) => r.status === "failed").length,
    expired: rows.filter((r) => r.status === "expired").length,
  }

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Mighty Invites" },
        ]}
      />
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Mighty Invite Audit</h1>
          <p className="text-muted-foreground text-sm">
            Every invite sent to the AI Operator Collective, with status and
            failure reason. Failed invites need re-sending from the deal drawer.
          </p>
        </div>
        <AddDealDialog buttonLabel="Add member manually" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <Stat label="Total" value={counts.total} tone="muted" />
        <Stat label="Sent" value={counts.sent} tone="muted" />
        <Stat label="Pending" value={counts.pending} tone="muted" />
        <Stat label="Accepted" value={counts.accepted} tone="strong" />
        <Stat label="Failed" value={counts.failed} tone="accent" />
        <Stat
          label="Never Invited"
          value={awaitingInviteDeals.length}
          tone={awaitingInviteDeals.length > 0 ? "accent" : "muted"}
        />
      </div>

      {awaitingInviteDeals.length > 0 && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Consults done, no Mighty invite yet
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These deals completed a consult but the admin never clicked
                Invite. They won&apos;t appear in the audit table below since
                no invite attempt was recorded.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {awaitingInviteDeals.slice(0, 9).map((d) => (
              <Link
                key={d.id}
                href={`/admin/crm/${d.id}`}
                className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {d.contactName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {d.contactEmail}
                    </p>
                  </div>
                  {d.leadScoreTier && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/30 text-primary bg-primary/5 flex-shrink-0 capitalize">
                      {d.leadScoreTier}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>
                    {d.stage === "CONSULT_BOOKED"
                      ? "Consult booked"
                      : "Consult done"}
                  </span>
                  <span>
                    {Math.max(
                      0,
                      Math.floor((Date.now() - d.updatedAt.getTime()) / 86_400_000)
                    )}d
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {awaitingInviteDeals.length > 9 && (
            <p className="mt-3 text-xs text-muted-foreground">
              + {awaitingInviteDeals.length - 9} more consults awaiting invite.
              Open them in the{" "}
              <Link href="/admin/crm" className="text-primary hover:underline">
                CRM pipeline
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-1">No invites yet</p>
          <p className="text-sm text-muted-foreground">
            Once you invite an applicant from the{" "}
            <Link href="/admin/crm" className="text-primary hover:underline">CRM pipeline</Link>, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <MightyInviteAuditTable rows={rows} />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "muted" | "accent" | "strong"
}) {
  // Keep the palette on-brand: neutral for informational counts, crimson
  // highlight for anything that needs the admin's attention (failures),
  // deeper crimson for success milestones.
  const toneClass: Record<typeof tone, string> = {
    muted: "text-foreground border-border",
    accent: "text-primary border-primary/40 bg-primary/5",
    strong: "text-primary border-primary/30",
  }
  return (
    <div className={`bg-card border rounded-lg px-4 py-3 ${toneClass[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-mono font-semibold mt-0.5">{value}</div>
    </div>
  )
}
