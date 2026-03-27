import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { getPulseSurveys, createPulseSurvey, logActivity } from "@/lib/ops-excellence/queries"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const engagementId = searchParams.get("engagementId")

    if (!engagementId) {
      return NextResponse.json({ error: "engagementId query param required" }, { status: 400 })
    }

    const surveys = await getPulseSurveys(engagementId)
    return NextResponse.json({ data: surveys })
  } catch (err) {
    logger.error("Failed to fetch pulse surveys", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const surveySchema = z.object({
  engagementId: z.string().min(1),
  automationCardId: z.string().optional(),
  respondentRole: z.string().min(1),
  timeSavedPerWeek: z.number().min(0).optional(),
  capacityConversion: z.enum(["HIGHER_VALUE_WORK", "ABSORBED_NO_CHANGE", "NOT_VISIBLE_YET"]),
  feedback: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = surveySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const engagement = await db.opsExcellenceEngagement.findUnique({
      where: { id: parsed.data.engagementId },
      select: { id: true },
    })

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
    }

    const survey = await createPulseSurvey(parsed.data)

    await logActivity({
      engagementId: parsed.data.engagementId,
      type: "PULSE_SURVEY_SUBMITTED",
      title: "Capacity pulse survey submitted",
      detail: `Role: ${parsed.data.respondentRole} | Conversion: ${parsed.data.capacityConversion}`,
      metadata: {
        surveyId: survey.id,
        capacityConversion: parsed.data.capacityConversion,
        timeSavedPerWeek: parsed.data.timeSavedPerWeek,
      },
    })

    return NextResponse.json({ success: true, data: survey }, { status: 201 })
  } catch (err) {
    logger.error("Failed to submit pulse survey", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
