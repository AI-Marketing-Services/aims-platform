import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { MightyInviteAuditTable, type AuditRow } from "./MightyInviteAuditTable"

export const dynamic = "force-dynamic"

export default async function MightyInviteAuditPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const invites = await db.mightyInvite.findMany({
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
  })

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Mighty Invite Audit</h1>
        <p className="text-muted-foreground">
          Every invite sent to the AI Operator Collective, with status and failure reason. Failed invites need re-sending from the deal drawer.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="Total" value={counts.total} tone="muted" />
        <Stat label="Sent" value={counts.sent} tone="blue" />
        <Stat label="Pending" value={counts.pending} tone="amber" />
        <Stat label="Accepted" value={counts.accepted} tone="green" />
        <Stat label="Failed" value={counts.failed} tone="red" />
      </div>

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
  tone: "muted" | "blue" | "amber" | "green" | "red"
}) {
  const toneClass: Record<typeof tone, string> = {
    muted: "text-muted-foreground border-border",
    blue: "text-blue-400 border-blue-800",
    amber: "text-amber-400 border-amber-800",
    green: "text-green-400 border-green-800",
    red: "text-primary border-primary/30",
  }
  return (
    <div className={`bg-card border rounded-lg px-4 py-3 ${toneClass[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-mono font-semibold mt-0.5">{value}</div>
    </div>
  )
}
