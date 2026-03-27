import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { createEngagement, logActivity } from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

const intakeSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  annualRevenue: z.string().optional(),
  employeeCount: z.coerce.number().int().positive().optional(),
  website: z.string().url().optional().or(z.literal("")),
  intakeData: z.record(z.unknown()),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = intakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { intakeData, ...companyFields } = parsed.data

    const engagement = await createEngagement({
      userId: user.id,
      ...companyFields,
      intakeData: intakeData as Prisma.InputJsonValue,
    })

    await logActivity({
      engagementId: engagement.id,
      type: "INTAKE_SUBMITTED",
      title: "Intake form submitted",
      detail: `Company: ${engagement.companyName}`,
    })

    return NextResponse.json({ success: true, data: engagement }, { status: 201 })
  } catch (err) {
    logger.error("Ops excellence intake submission failed", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
