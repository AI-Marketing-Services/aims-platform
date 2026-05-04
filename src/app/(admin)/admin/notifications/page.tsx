import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { NotificationsTable } from "./NotificationsTable"

export const dynamic = "force-dynamic"

/**
 * Full-list notifications surface. The bell drawer caps at 20; admins
 * with a hundred-plus stale entries (e.g. the April 2026 orphan
 * Calendly flood) need a way to see everything, filter by type, and
 * bulk-delete the noise.
 */
export default async function NotificationsAdminPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  // Pull everything — page is paginated client-side. Cap at 1k so a
  // pathological row count can't blow up the page.
  const notifications = await db.notification.findMany({
    orderBy: { sentAt: "desc" },
    take: 1000,
  })

  // Counts per type so the filter chips can show volume.
  const typeCounts = new Map<string, { total: number; unread: number }>()
  let unreadTotal = 0
  for (const n of notifications) {
    const bucket = typeCounts.get(n.type) ?? { total: 0, unread: 0 }
    bucket.total += 1
    if (!n.read) {
      bucket.unread += 1
      unreadTotal += 1
    }
    typeCounts.set(n.type, bucket)
  }

  // Aggregate "title-clusters" so admins can spot recurring noise like
  // the orphan-Calendly flood at a glance.
  const titleCounts = new Map<string, number>()
  for (const n of notifications) {
    titleCounts.set(n.title, (titleCounts.get(n.title) ?? 0) + 1)
  }
  const topClusters = Array.from(titleCounts.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Notifications" },
          ]}
        />
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {notifications.length} loaded · {unreadTotal} unread · sorted newest first
        </p>
      </div>

      {topClusters.length > 0 && (
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
            Top recurring titles (likely noise)
          </p>
          <ul className="space-y-1">
            {topClusters.map(([title, count]) => (
              <li
                key={title}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink truncate mr-3">{title}</span>
                <span className="font-mono text-ink/60 text-xs flex-shrink-0">
                  {count} ×
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-ink/50 mt-3">
            Use the filters below to isolate any of these and click
            &ldquo;Delete filtered&rdquo; to clear them in bulk.
          </p>
        </div>
      )}

      <NotificationsTable
        initial={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          sentAt: n.sentAt.toISOString(),
          metadata: (n.metadata as Record<string, unknown> | null) ?? undefined,
        }))}
        typeCounts={Array.from(typeCounts.entries()).map(([type, c]) => ({
          type,
          total: c.total,
          unread: c.unread,
        }))}
      />
    </div>
  )
}
