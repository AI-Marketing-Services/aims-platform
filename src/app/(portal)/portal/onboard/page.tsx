import type { Metadata } from "next"
import { db } from "@/lib/db"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { OnboardingChecklist } from "@/components/portal/OnboardingChecklist"
import { BusinessProfileForm } from "./BusinessProfileForm"
import { OnboardTabs } from "./OnboardTabs"
import { Rocket } from "lucide-react"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"

export const metadata: Metadata = { title: "Getting Started" }

export default async function OnboardPage() {
  const baseUser = await ensureDbUser()

  const dbUser = await db.user.findUnique({
    where: { id: baseUser.id },
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
          brandColor: true,
          tagline: true,
          onboardingCompletedAt: true,
        },
      },
    },
  })

  if (!dbUser) {
    // Should be unreachable after ensureDbUser, but render a safe fallback
    // instead of redirecting so we never bounce a real client.
    return null
  }

  const progress = await getProgressForUser(dbUser.id)
  const completedKeys = [...progress.completedKeys]

  return (
    <div className="w-full max-w-4xl space-y-6">
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

      {/* Tabbed content */}
      <OnboardTabs
        completedCount={progress.completedCount}
        totalSteps={TOTAL_STEPS}
        percent={progress.percent}
        roadmapSection={
          <div className="rounded-2xl border border-border bg-card p-6">
            <OnboardingChecklist initialCompletedKeys={completedKeys} variant="full" />
          </div>
        }
        profileSection={
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs text-muted-foreground mb-5">
              Visible to your cohort in the community directory.
            </p>
            <BusinessProfileForm initialProfile={dbUser.memberProfile ?? null} />
          </div>
        }
      />
    </div>
  )
}
