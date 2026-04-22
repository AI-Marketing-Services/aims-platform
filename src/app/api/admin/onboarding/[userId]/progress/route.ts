import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { ONBOARDING_STEP_KEYS } from "@/lib/onboarding/steps"
import { markStepComplete, resetStep } from "@/lib/onboarding/progress"

const bodySchema = z.object({
  stepKey: z.enum(ONBOARDING_STEP_KEYS),
  action: z.enum(["complete", "reset"]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminClerkId = await requireAdmin()
  if (!adminClerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { stepKey, action } = parsed.data

  try {
    if (action === "complete") {
      await markStepComplete({
        userId,
        stepKey,
        method: "admin",
        completedBy: adminClerkId,
      })
    } else {
      await resetStep({
        userId,
        stepKey,
        resetBy: adminClerkId,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
