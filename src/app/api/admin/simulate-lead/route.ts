import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const simulateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  type: z.enum(["AI_READINESS_QUIZ", "ROI_CALCULATOR", "WEBSITE_AUDIT", "SEGMENT_EXPLORER", "STACK_CONFIGURATOR"]),
  score: z.number().min(0).max(100).optional(),
})

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })

  const parsed = simulateLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, type, score } = parsed.data

  try {
    const submission = await db.leadMagnetSubmission.create({
      data: {
        name,
        email,
        type,
        score: score ?? null,
        data: { simulated: true, score },
      },
    })

    const deal = await db.deal.create({
      data: {
        contactName: name,
        contactEmail: email,
        stage: "APPLICATION_SUBMITTED",
        leadScore: score ?? 0,
        channelTag: type.toLowerCase(),
        value: 0,
        source: "simulate-lead",
        sourceDetail: `Simulated ${type} submission`,
      },
    })

    // Fire an in-app notification
    await db.notification
      .create({
        data: {
          type: "new_lead",
          title: `[SIMULATED] New Lead - ${type.replace(/_/g, " ")}`,
          message: `${name} (${email}) submitted ${type.replace(/_/g, " ")} with score ${score ?? "N/A"}`,
          channel: "IN_APP",
        },
      })
      .catch((err) => logger.error("Simulate-lead notification creation failed:", err))

    return NextResponse.json({ success: true, submission, deal }, { status: 201 })
  } catch (e) {
    logger.error("Simulate lead DB error:", e)
    return NextResponse.json({ error: "Failed to create simulated lead" }, { status: 500 })
  }
}
