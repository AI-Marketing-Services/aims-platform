import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Briefcase, ExternalLink, Github, Linkedin, Globe } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Portfolio" }

export default async function InternPortfolioPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const intern = await db.internProfile.findUnique({
    where: { userId: dbUser.id },
    include: {
      tasks: {
        where: { status: "DONE" },
        orderBy: { completedAt: "desc" },
        take: 20,
      },
    },
  })

  if (!intern) redirect("/intern/dashboard")

  const completedTasks = intern.tasks
  const totalRevenue = intern.revenueAttributed

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Your work history and accomplishments at AIMS</p>
      </div>

      {/* Profile Links */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {intern.portfolio && (
            <a
              href={intern.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
            >
              <Globe className="h-4 w-4" />
              Portfolio Site
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {intern.linkedIn && (
            <a
              href={intern.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {intern.university && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              {intern.university}
            </div>
          )}
        </div>
        {!intern.portfolio && !intern.linkedIn && (
          <p className="text-sm text-muted-foreground">
            No profile links added yet. Contact your manager to update your profile.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tasks Completed", value: intern.tasksCompleted },
          { label: "Revenue Attributed", value: `$${totalRevenue.toLocaleString()}` },
          { label: "Role", value: intern.role.replace("_", " ") },
          { label: "Status", value: intern.status },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Completed Work */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Completed Work</h2>
        {completedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed tasks yet. Keep building!</p>
        ) : (
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  {task.revenueImpact != null && task.revenueImpact > 0 && (
                    <span className="text-primary font-medium">${task.revenueImpact.toLocaleString()}</span>
                  )}
                  {task.completedAt && (
                    <time dateTime={task.completedAt.toISOString()}>
                      {task.completedAt.toLocaleDateString()}
                    </time>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
