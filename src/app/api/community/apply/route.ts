import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { sendOperatorVaultEmail } from "@/lib/email/operator-vault"
import { queueEmailSequence } from "@/lib/email/queue"
import { QUESTIONS, calculateScore } from "@/lib/collective-application"

const validValues = QUESTIONS.reduce<Record<string, string[]>>((acc, q) => {
  acc[q.id] = q.options.map((o) => o.value)
  return acc
}, {})

const answersSchema = z.object(
  Object.fromEntries(
    QUESTIONS.map((q) => [q.id, z.enum(validValues[q.id] as [string, ...string[]])])
  )
)

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(180),
  answers: answersSchema,
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

    const { name, email, answers, source, utmSource, utmMedium, utmCampaign } = parsed.data
    const { normalizedScore, tier, priority, reason } = calculateScore(answers)

    const stage = tier === "hot" ? "QUALIFIED" : "NEW_LEAD"

    const [submission, deal] = await Promise.all([
      db.leadMagnetSubmission
        .create({
          data: {
            type: "COLLECTIVE_APPLICATION",
            email,
            name,
            data: answers,
            score: normalizedScore,
            source: source ?? "apply-form",
            utmSource,
            utmMedium,
            utmCampaign,
          },
        })
        .catch((err) => {
          logger.error("Failed to create application submission", err)
          return null
        }),
      db.deal
        .create({
          data: {
            contactName: name,
            contactEmail: email,
            source: "ai-operator-collective-application",
            sourceDetail: `Collective application form. Score: ${normalizedScore}. Tier: ${tier}.`,
            channelTag: utmSource ?? source ?? "organic",
            utmSource,
            utmMedium,
            utmCampaign,
            stage,
            priority,
            leadScore: normalizedScore,
            leadScoreTier: tier,
            leadScoreReason: reason,
            activities: {
              create: {
                type: "FORM_SUBMITTED",
                detail: `AI Operator Collective application from ${name} (${email}). Score: ${normalizedScore}/100 (${tier}).`,
              },
            },
          },
        })
        .catch((err) => {
          logger.error("Failed to create deal from application", err)
          return null
        }),
    ])

    if (submission && deal) {
      db.leadMagnetSubmission
        .update({ where: { id: submission.id }, data: { dealId: deal.id } })
        .catch((err) => logger.error("Failed to link submission to deal", err))
    }

    sendOperatorVaultEmail({ to: email, name }).catch((err) =>
      logger.error("Failed to send operator vault email", err)
    )

    queueEmailSequence(email, "operator-vault", {
      name,
      source: source ?? "apply-form",
    }).catch((err) => logger.error("Failed to enqueue operator-vault sequence", err))

    if (deal) {
      const urgency = tier === "hot" ? "high" : "normal"
      notify({
        type: "new_lead",
        title: `New Collective Application (${tier.toUpperCase()})`,
        message: `${name} (${email}) scored ${normalizedScore}/100. Tier: ${tier}.`,
        urgency: urgency as "high" | "normal",
      }).catch((err) => logger.error("Failed to notify application", err))

      createCloseLead({
        contactName: name,
        contactEmail: email,
        source: "ai-operator-collective-application",
        dealId: deal.id,
      })
        .then((closeLeadId) => {
          if (closeLeadId) {
            db.deal
              .update({ where: { id: deal.id }, data: { closeLeadId } })
              .catch((e) => logger.error("Failed to update deal with closeLeadId", e))
          }
        })
        .catch((err) => logger.error("Failed to sync application to Close", err))
    }

    return NextResponse.json({ ok: true, score: normalizedScore, tier }, { status: 201 })
  } catch (err) {
    logger.error("Application submission failed", err, {
      endpoint: "POST /api/community/apply",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
