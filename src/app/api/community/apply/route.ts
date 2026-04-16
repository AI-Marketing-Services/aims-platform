import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { notify, notifyHotLead } from "@/lib/notifications"
// createCloseLead + queueEmailSequence are intentionally unimported — the
// Close sync is disabled (no workspace) and no drip is queued at apply-submit
// time. The post-booking drip is queued from the Calendly webhook instead.
import { QUESTIONS, calculateScore, getCalendarUrl } from "@/lib/collective-application"

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

    // Always create a new submission record (full audit of every answer set).
    const submission = await db.leadMagnetSubmission
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
      })

    // Dedup the Deal. If this email already has an active deal (anything
    // other than CHURNED/LOST), update it instead of creating a duplicate.
    // This prevents pipeline bloat + duplicate drips when someone re-applies.
    const existingDeal = await db.deal.findFirst({
      where: {
        contactEmail: { equals: email, mode: "insensitive" },
        source: "ai-operator-collective-application",
        stage: { notIn: ["CHURNED", "LOST"] },
      },
      orderBy: { createdAt: "desc" },
    })

    let deal: { id: string } | null = null

    if (existingDeal) {
      try {
        // Only upgrade score if the new one is higher. Never downgrade stage.
        const shouldUpgradeScore =
          existingDeal.leadScore == null || normalizedScore > existingDeal.leadScore
        deal = await db.deal.update({
          where: { id: existingDeal.id },
          data: {
            contactName: name,
            phone: phone,
            ...(shouldUpgradeScore
              ? {
                  leadScore: normalizedScore,
                  leadScoreTier: tier,
                  leadScoreReason: reason,
                  priority,
                }
              : {}),
            activities: {
              create: {
                type: "FORM_SUBMITTED",
                detail: `Re-applied. New score: ${normalizedScore}/100 (${tier}).${shouldUpgradeScore ? " Deal score upgraded." : " Existing score kept (higher)."}`,
              },
            },
          },
          select: { id: true },
        })
      } catch (err) {
        logger.error("Failed to update existing deal on re-apply", err)
        deal = null
      }
    } else {
      deal = await db.deal
        .create({
          data: {
            contactName: name,
            contactEmail: email,
            phone,
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
          select: { id: true },
        })
        .catch((err) => {
          logger.error("Failed to create deal from application", err)
          return null
        })
    }

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

    // Mark any partial application for this email as completed so the
    // abandoned-application cron stops targeting them.
    if (deal) {
      db.partialApplication
        .updateMany({
          where: { email, completedAt: null },
          data: { completedAt: new Date(), dealId: deal.id },
        })
        .catch((err) =>
          logger.error("Failed to mark partial application as completed", err)
        )
    }

    // Email drips only queue AFTER the applicant books a call (see Calendly
    // webhook). If they never book, the nurture-unbooked cron handles day
    // 2/5/9 booking reminders. No drip fires at apply-submit time — the
    // prospect hasn't proven intent yet.

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
          calLink: getCalendarUrl(tier),
        }).catch((err) => logger.error("Failed to notify hot lead", err))
      } else {
        notify({
          type: "new_lead",
          title: `New Collective Application (${tier.toUpperCase()})`,
          message: `${name} (${email}) scored ${normalizedScore}/100. Tier: ${tier}. Phone: ${phone}. Country: ${country}.`,
          urgency: "normal",
        }).catch((err) => logger.error("Failed to notify application", err))
      }

      // Close CRM integration intentionally disabled — no Close workspace
      // provisioned for this funnel yet. To re-enable, call createCloseLead
      // from @/lib/close and persist the returned closeLeadId onto Deal.
    }

    return NextResponse.json({ ok: true, score: normalizedScore, tier }, { status: 201 })
  } catch (err) {
    logger.error("Application submission failed", err, {
      endpoint: "POST /api/community/apply",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
