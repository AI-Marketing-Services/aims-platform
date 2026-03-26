import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FulfillmentPipeline } from "./FulfillmentPipeline"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export default async function AdminFulfillmentPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const tasks = await db.fulfillmentTask.findMany({
    include: {
      subscription: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          serviceArm: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  const initialTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    status: t.status,
    assignedTo: t.assignedTo ?? undefined,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? undefined,
    completedAt: t.completedAt?.toISOString() ?? undefined,
    clientName: t.subscription.user.name ?? t.subscription.user.email ?? "Unknown",
    clientEmail: t.subscription.user.email ?? "",
    serviceName: t.subscription.serviceArm.name,
    serviceSlug: t.subscription.serviceArm.slug,
    subscriptionId: t.subscriptionId,
  }))

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Fulfillment Pipeline" },
          ]}
        />
        <h1 className="text-2xl font-bold text-foreground mb-1">Fulfillment Pipeline</h1>
        <p className="text-muted-foreground">Manage client onboarding and service delivery tasks</p>
      </div>
      <FulfillmentPipeline initialTasks={initialTasks} />
    </div>
  )
}
