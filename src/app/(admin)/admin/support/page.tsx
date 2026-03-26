import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { LifeBuoy } from "lucide-react"
import { AdminSupportClient } from "./AdminSupportClient"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = { title: "Support Tickets" }

export default async function AdminSupportPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const tickets = await db.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          message: true,
          isAdmin: true,
          authorId: true,
          authorName: true,
          createdAt: true,
        },
      },
    },
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
  }

  const serialized = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    replies: t.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Support Tickets" },
        ]}
      />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <LifeBuoy className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage client support requests</p>
        </div>
      </div>

      <AdminSupportClient tickets={serialized} stats={stats} />
    </div>
  )
}
