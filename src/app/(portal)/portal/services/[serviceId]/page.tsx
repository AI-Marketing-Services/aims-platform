import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CheckCircle2, Clock, AlertCircle, Circle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

const PILLAR_PILL: Record<string, string> = {
  MARKETING: "bg-primary/5 text-primary/80 border-primary/20",
  SALES: "bg-primary/10 text-primary border-primary/30",
  OPERATIONS: "bg-primary/15 text-primary border-primary/40",
  FINANCE: "bg-muted/50 text-muted-foreground border-border",
}

const STATUS_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; label: string; color: string }> = {
  done: { icon: CheckCircle2, label: "Complete", color: "text-primary" },
  in_progress: { icon: Clock, label: "In Progress", color: "text-primary" },
  blocked: { icon: AlertCircle, label: "Blocked", color: "text-primary" },
  todo: { icon: Circle, label: "Pending", color: "text-muted-foreground" },
}

const FULFILLMENT_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_SETUP: { label: "Pending Setup", color: "text-muted-foreground bg-muted/50 border-border" },
  IN_PROGRESS: { label: "In Progress", color: "text-primary bg-primary/5 border-primary/30" },
  ACTIVE_MANAGED: { label: "Active", color: "text-primary bg-primary/5 border-primary/20" },
  NEEDS_ATTENTION: { label: "Needs Attention", color: "text-primary bg-primary/10 border-primary/30" },
  COMPLETED: { label: "Completed", color: "text-primary bg-primary/5 border-primary/20" },
  ON_HOLD: { label: "On Hold", color: "text-muted-foreground bg-muted/40 border-border" },
}

export default async function PortalServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const subscription = await db.subscription.findFirst({
    where: { userId: dbUser.id, serviceArmId: serviceId },
    include: {
      serviceArm: true,
      fulfillmentTasks: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!subscription) notFound()

  const { serviceArm, fulfillmentTasks } = subscription
  const fulStatus = FULFILLMENT_LABELS[subscription.fulfillmentStatus] ?? FULFILLMENT_LABELS.PENDING_SETUP

  const totalTasks = fulfillmentTasks.length
  const doneTasks = fulfillmentTasks.filter((t) => t.status === "done").length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="max-w-3xl space-y-8">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Services", href: "/portal/services" },
          { label: serviceArm.name },
        ]}
      />

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", PILLAR_PILL[serviceArm.pillar] ?? "text-muted-foreground bg-muted")}>
                {serviceArm.pillar.charAt(0) + serviceArm.pillar.slice(1).toLowerCase()}
              </span>
              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", fulStatus.color)}>
                {fulStatus.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{serviceArm.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{serviceArm.shortDesc}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-foreground">${subscription.monthlyAmount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">/month • {subscription.tier ?? "Standard"}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Started</p>
            <p className="text-sm font-medium text-foreground">
              {subscription.createdAt
                ? new Date(subscription.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Next billing</p>
            <p className="text-sm font-medium text-foreground">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Team member</p>
            <p className="text-sm font-medium text-foreground">
              {subscription.assignedTeamMember ?? "Assigning..."}
            </p>
          </div>
        </div>
      </div>

      {/* Setup Progress */}
      {totalTasks > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Setup Progress</h2>
            <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} steps complete</span>
          </div>

          {/* Progress bar */}
          <div className="mb-5 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {fulfillmentTasks.map((task, i) => {
              const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo
              const Icon = cfg.icon
              return (
                <div key={task.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <Icon className={cn("h-4 w-4 mt-0.5", cfg.color)} />
                    {i < fulfillmentTasks.length - 1 && (
                      <div className="w-px h-5 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium", task.status === "done" ? "text-muted-foreground line-through" : "text-foreground")}>
                        {task.title}
                      </p>
                      <span className={cn("text-[11px] font-medium flex-shrink-0", cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                    )}
                    {task.dueDate && task.status !== "done" && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {totalTasks === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Setup in progress</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your team member will reach out within 24 hours to begin onboarding.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/portal/support"
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Contact Support
        </Link>
        <Link
          href={`/services/${serviceArm.slug}`}
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          View Service Page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
