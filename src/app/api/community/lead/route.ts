import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(180),
  source: z.string().max(60).optional(),
  utmSource: z.string().max(60).optional(),
  utmMedium: z.string().max(60).optional(),
  utmCampaign: z.string().max(60).optional(),
})

export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, source, utmSource, utmMedium, utmCampaign } = parsed.data

    const deal = await db.deal
      .create({
        data: {
          contactName: name,
          contactEmail: email,
          source: "ai-operator-collective",
          sourceDetail: `Community application via ${source ?? "landing"}`,
          channelTag: utmSource ?? source ?? "organic",
          utmSource,
          utmMedium,
          utmCampaign,
          stage: "NEW_LEAD",
          priority: "HIGH",
          leadScore: 70,
          leadScoreTier: "warm",
          leadScoreReason: "AI Operator Collective application submitted",
          activities: {
            create: {
              type: "FORM_SUBMITTED",
              detail: `AI Operator Collective application from ${name} (${email}) via ${source ?? "landing"}`,
            },
          },
        },
      })
      .catch((err) => {
        logger.error("Failed to create deal from community lead", err)
        return null
      })

    if (deal) {
      await notify({
        type: "new_lead",
        title: "New AI Operator Collective Application",
        message: `${name} (${email}) submitted via ${source ?? "landing"}`,
        urgency: "normal",
      }).catch((err) => logger.error("Failed to notify community lead", err))

      createCloseLead({
        contactName: name,
        contactEmail: email,
        source: "ai-operator-collective",
        dealId: deal.id,
      })
        .then((closeLeadId) => {
          if (closeLeadId) {
            db.deal
              .update({ where: { id: deal.id }, data: { closeLeadId } })
              .catch((e) => logger.error("Failed to update deal with closeLeadId", e))
          }
        })
        .catch((err) => logger.error("Failed to sync community lead to Close", err))
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    logger.error("Community lead submission failed", err, {
      endpoint: "POST /api/community/lead",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
