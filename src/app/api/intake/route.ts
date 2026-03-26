import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { notifyNewLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { scoreLeadFromSignals } from "@/lib/scoring/lead-scorer"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

const intakeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  locations: z.string().optional(),
  goal: z.string().optional(),
  services: z.array(z.string()).default([]),
})

export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = intakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const scored = scoreLeadFromSignals({
      source: "intake-form",
      industry: data.industry,
      locationCount: data.locations ? parseInt(data.locations) || 1 : 1,
      isVendingpreneur: data.industry?.toLowerCase().includes("vend") || false,
    })

    const deal = await db.deal.create({
      data: {
        contactName: data.name,
        contactEmail: data.email,
        company: data.company,
        phone: data.phone,
        website: data.website,
        industry: data.industry,
        source: "get-started-form",
        sourceDetail: `locations:${data.locations ?? "1"}`,
        leadScore: scored.score,
        leadScoreTier: scored.tier,
        leadScoreReason: scored.reason,
        priority: scored.priority as import("@prisma/client").DealPriority,
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `Strategy call request - services: ${data.services.join(", ") || "not specified"}. Goal: ${data.goal ?? "-"}`,
          },
        },
      },
    })

    await notifyNewLead({
      contactName: data.name,
      contactEmail: data.email,
      company: data.company,
      source: "get-started-form",
    }).catch((err) => logger.error("Operation failed", err))

    // Sync to Close CRM (fire-and-forget)
    createCloseLead({
      contactName: data.name,
      contactEmail: data.email,
      company: data.company,
      phone: data.phone,
      website: data.website,
      source: "get-started-form",
      services: data.services,
      dealId: deal.id,
    }).then((closeLeadId) => {
      if (closeLeadId) {
        db.deal.update({ where: { id: deal.id }, data: { closeLeadId } }).catch((err) => logger.error("Operation failed", err))
      }
    }).catch((err) => logger.error("Operation failed", err))

    return NextResponse.json({ id: deal.id }, { status: 201 })
  } catch (err) {
    logger.error("Intake submission failed:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
