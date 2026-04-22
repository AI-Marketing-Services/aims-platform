import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { OnboardingChecklist } from "@/components/portal/OnboardingChecklist"
import { BusinessProfileForm } from "./BusinessProfileForm"
import { Rocket, UserCircle } from "lucide-react"

export const metadata: Metadata = { title: "Getting Started" }

export default async function OnboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      name: true,
      memberProfile: {
        select: {
          businessName: true,
          logoUrl: true,
          oneLiner: true,
          niche: true,
          idealClient: true,
          businessUrl: true,
          onboardingCompletedAt: true,
        },
      },
    },
  })

  if (!dbUser) redirect("/sign-in")

  const progress = await getProgressForUser(dbUser.id)
  const completedKeys = [...progress.completedKeys]

  return (
    <div className="max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/portal/dashboard" },
          { label: "Getting Started" },
        ]}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Getting Started</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Your 30-day roadmap for getting the most out of the AI Operator Collective.
          {progress.percent === 100 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
              Completed!
            </span>
          )}
        </p>
      </div>

      {/* Business Profile */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserCircle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Your Business Profile</h2>
          <span className="ml-auto text-xs text-muted-foreground">Visible to your cohort</span>
        </div>
        <BusinessProfileForm initialProfile={dbUser.memberProfile ?? null} />
      </div>

      {/* 30-day checklist */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">30-Day Roadmap</h2>
        </div>
        <OnboardingChecklist initialCompletedKeys={completedKeys} variant="full" />
      </div>
    </div>
  )
}
