import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { notify, notifyHotLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
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

const schema = z
  .object({
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    email: z.string().email().max(180),
    phone: z.string().min(1).max(30),
    zipCode: z.string().min(1).max(20),
    country: z.enum(["US", "CA", "UK"]),
    smsConsentFollowup: z.boolean(),
    smsConsentPromo: z.boolean(),
    answers: answersSchema,
    backgroundOther: z.string().max(200).optional(),
    source: z.string().max(60).optional(),
    utmSource: z.string().max(60).optional(),
    utmMedium: z.string().max(60).optional(),
    utmCampaign: z.string().max(60).optional(),
  })
  .refine(
    (d) =>
      d.answers.background !== "other" ||
      (d.backgroundOther && d.backgroundOther.trim().length > 0),
    { message: "Background detail required when 'Other' is selected", path: ["backgroundOther"] }
  )

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

    const {
      firstName,
      lastName,
      email,
      phone,
      zipCode,
      country,
      smsConsentFollowup,
      smsConsentPromo,
      answers,
      backgroundOther,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    } = parsed.data

    const name = `${firstName} ${lastName}`
    const { normalizedScore, tier, priority, reason } = calculateScore(answers)
    const stage = tier === "hot" ? "QUALIFIED" : "NEW_LEAD"

    const [submission, deal] = await Promise.all([
      db.leadMagnetSubmission
        .create({
          data: {
            type: "COLLECTIVE_APPLICATION",
            email,
            name,
            data: {
              ...answers,
              firstName,
              lastName,
              phone,
              zipCode,
              country,
              smsConsentFollowup,
              smsConsentPromo,
              backgroundOther: backgroundOther ?? null,
            },
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
            sourceDetail: `Collective application. Score: ${normalizedScore}. Tier: ${tier}. Country: ${country}.`,
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
                detail: `AI Operator Collective application from ${name} (${email}). Score: ${normalizedScore}/100 (${tier}). Phone: ${phone}. Zip: ${zipCode}. Country: ${country}.`,
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
      try {
        await db.leadMagnetSubmission.update({
          where: { id: submission.id },
          data: { dealId: deal.id },
        })
      } catch (err) {
        logger.error("Failed to link submission to deal", err)
      }
    }

    // Email is now sent via Calendly webhook (POST /api/webhooks/calendly)
    // after the applicant books a call. We still queue the nurture sequence
    // for applicants who may not book immediately.
    queueEmailSequence(email, "operator-vault", {
      name,
      source: source ?? "apply-form",
    }).catch((err) => logger.error("Failed to enqueue operator-vault sequence", err))

    if (deal) {
      if (tier === "hot") {
        notifyHotLead({
          dealId: deal.id,
          name,
          email,
          phone,
          score: normalizedScore,
          tier,
          country,
          reason,
          calLink: "adamwolfe/aoc",
        }).catch((err) => logger.error("Failed to notify hot lead", err))
      } else {
        notify({
          type: "new_lead",
          title: `New Collective Application (${tier.toUpperCase()})`,
          message: `${name} (${email}) scored ${normalizedScore}/100. Tier: ${tier}. Phone: ${phone}. Country: ${country}.`,
          urgency: "normal",
        }).catch((err) => logger.error("Failed to notify application", err))
      }

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
