// ONBOARDING_STEP_COMPLETED exists in schema.prisma but requires `prisma generate`
// to appear in the Prisma-generated enum type. The activity type field is typed as
// a string at runtime so we do a plain string comparison here and avoid importing
// the enum directly.

export const DEAL_CHECKLIST_STEPS = [
  { key: "kickoff_scheduled", label: "Schedule kickoff call" },
  { key: "access_granted", label: "Grant tool/platform access" },
  { key: "goals_documented", label: "Document client goals & KPIs" },
  { key: "workflow_delivered", label: "Deliver first workflow/automation" },
  { key: "check_in_30", label: "30-day check-in completed" },
] as const

export type ChecklistStepKey = (typeof DEAL_CHECKLIST_STEPS)[number]["key"]

export interface ChecklistStep {
  key: ChecklistStepKey
  label: string
  completedAt: Date | null
}

export interface DealChecklistProgress {
  steps: ChecklistStep[]
  completedCount: number
  totalCount: number
  percent: number
}

interface ActivityRecord {
  type: string
  metadata: unknown
  createdAt: Date
}

export function getDealChecklistProgress(
  activities: ActivityRecord[]
): DealChecklistProgress {
  const completionMap = new Map<string, Date>()

  for (const activity of activities) {
    if (activity.type !== "ONBOARDING_STEP_COMPLETED") continue
    const meta = activity.metadata as Record<string, unknown> | null
    const stepKey = typeof meta?.stepKey === "string" ? meta.stepKey : null
    if (stepKey && !completionMap.has(stepKey)) {
      completionMap.set(stepKey, new Date(activity.createdAt))
    }
  }

  const steps: ChecklistStep[] = DEAL_CHECKLIST_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    completedAt: completionMap.get(step.key) ?? null,
  }))

  const completedCount = steps.filter((s) => s.completedAt !== null).length
  const totalCount = steps.length
  const percent = Math.round((completedCount / totalCount) * 100)

  return { steps, completedCount, totalCount, percent }
}
