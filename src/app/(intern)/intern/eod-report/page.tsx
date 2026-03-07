import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { EODReportClient } from "./EODReportClient"

export const metadata = { title: "EOD Report" }

export default async function InternEODPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const profile = await db.internProfile.findUnique({
    where: { userId: dbUser.id },
    include: {
      eodReports: { orderBy: { date: "desc" }, take: 7 },
      tasks: { where: { status: "DONE" }, orderBy: { completedAt: "desc" }, take: 10 },
    },
  })

  const recentReports = (profile?.eodReports ?? []).map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    completed: r.completed,
    nextPriority: r.nextPriority,
    blockers: r.blockers,
    hoursWorked: r.hoursWorked,
  }))

  const recentCompletedTasks = (profile?.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
  }))

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">EOD Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your end-of-day report — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      <EODReportClient
        internId={profile?.id ?? null}
        recentReports={recentReports}
        recentCompletedTasks={recentCompletedTasks}
      />
    </div>
  )
}
