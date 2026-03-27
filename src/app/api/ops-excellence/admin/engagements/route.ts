import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { getEngagementList } from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

const querySchema = z.object({
  stage: z.enum([
    "INTAKE", "ONBOARDING", "PHASE_1_INSTRUMENT", "PHASE_2_EXECUTE",
    "PHASE_3_PROVE", "ACTIVE_ONGOING", "PAUSED", "COMPLETED",
  ]).optional(),
  integratorId: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      stage: searchParams.get("stage") ?? undefined,
      integratorId: searchParams.get("integratorId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const engagements = await getEngagementList(parsed.data)
    return NextResponse.json({ data: engagements })
  } catch (err) {
    logger.error("Failed to fetch engagement list", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
