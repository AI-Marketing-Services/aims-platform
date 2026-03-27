import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import IntakeWizard from "@/components/ops-excellence/intake/IntakeWizard"

export const metadata: Metadata = {
  title: "Operational Excellence Intake",
}

export default async function OpsExcellenceIntakePage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  let hasEngagement = false
  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!dbUser) redirect("/sign-in")

    const existing = await db.opsExcellenceEngagement.findFirst({
      where: {
        userId: dbUser.id,
        stage: { notIn: ["COMPLETED", "PAUSED"] },
      },
      select: { id: true },
    })

    hasEngagement = !!existing
  } catch {
    // DB failure -- let them proceed rather than blocking
  }

  if (hasEngagement) {
    redirect("/portal/ops-excellence")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Operational Excellence Intake
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete this intake so we can build the right engagement plan for your
          organization. Takes about 10 minutes.
        </p>
      </div>

      <IntakeWizard />
    </div>
  )
}
