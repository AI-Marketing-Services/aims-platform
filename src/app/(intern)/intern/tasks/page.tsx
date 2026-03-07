import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { InternTaskBoard } from "./InternTaskBoard"

export const metadata = { title: "Tasks" }

export default async function InternTasksPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const profile = await db.internProfile.findUnique({
    where: { userId: dbUser.id },
    include: {
      tasks: {
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          sprintGoal: { select: { title: true } },
        },
      },
    },
  })

  const tasks = (profile?.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    sprintGoal: t.sprintGoal?.title ?? null,
    estimatedHours: t.estimatedHours ?? null,
    dueDate: t.dueDate?.toISOString() ?? null,
    linkedProductSlug: t.linkedProductSlug ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Drag tasks between columns to update status</p>
      </div>
      <InternTaskBoard tasks={tasks} />
    </div>
  )
}
