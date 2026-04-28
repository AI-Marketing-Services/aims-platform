import { redirect } from "next/navigation"
import { Bug } from "lucide-react"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { FeedbackInbox } from "./FeedbackInbox"
import { SlackTestButton } from "./SlackTestButton"

export const metadata = { title: "Portal Feedback", robots: { index: false } }
export const dynamic = "force-dynamic"

const STATUSES = [
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
  "RESOLVED",
  "WONT_FIX",
] as const

export default async function AdminFeedbackPage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  const items = await db.portalFeedback.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reporter: { select: { id: true, name: true, email: true } },
    },
  })

  const stats = {
    total: items.length,
    new: items.filter((i) => i.status === "NEW").length,
    inProgress: items.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: items.filter(
      (i) => i.status === "RESOLVED" || i.status === "WONT_FIX",
    ).length,
  }

  const serialized = items.map((i) => ({
    id: i.id,
    category: i.category,
    title: i.title,
    details: i.details,
    pageUrl: i.pageUrl,
    userAgent: i.userAgent,
    status: i.status,
    adminNote: i.adminNote,
    reporterEmail: i.reporterEmail,
    reporterName: i.reporterName,
    reporterId: i.reporterId,
    reporter: i.reporter,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Portal Feedback" },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portal Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Bug reports, ideas, and questions from clients in the portal.
            </p>
          </div>
        </div>
        <SlackTestButton />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.new, accent: "text-primary" },
          { label: "In Progress", value: stats.inProgress, accent: "text-amber-500" },
          { label: "Resolved", value: stats.resolved, accent: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${s.accent ?? "text-foreground"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <FeedbackInbox items={serialized} statuses={[...STATUSES]} />
    </div>
  )
}
