import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { notify, notifyHotLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { getValidatedAttributionResellerId } from "@/lib/tenant/attribution"
// No drip is queued at apply-submit time — the post-booking drip fires
// from the Calendly webhook instead, once the applicant has booked.
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
    // All fresh applications start at APPLICATION_SUBMITTED. Hot/warm/cold
    // lives on leadScoreTier — the stage reflects where they are in the
    // community funnel, not the score.
    const stage = "APPLICATION_SUBMITTED" as const

    // 30-second double-submit guard. If the same email just submitted the
    // form, return the prior result instead of inserting a duplicate
    // submission + activity log entry. Rate limit already catches spam;
    // this catches the mundane "user double-clicked Submit" case.
    const recentSubmission = await db.leadMagnetSubmission
      .findFirst({
        where: {
          email,
          type: "COLLECTIVE_APPLICATION",
          createdAt: { gte: new Date(Date.now() - 30 * 1000) },
        },
        select: { id: true, score: true, createdAt: true },
      })
      .catch(() => null)

    if (recentSubmission) {
      logger.info(
        `Ignored duplicate apply-submit within 30s for ${email}`,
        { action: "apply_duplicate_submit" }
      )
      return NextResponse.json(
        {
          ok: true,
          duplicate: true,
          score: recentSubmission.score ?? normalizedScore,
          tier,
        },
        { status: 200 }
      )
    }

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
    // other than LOST), update it instead of creating a duplicate. This
    // prevents pipeline bloat + duplicate drips when someone re-applies.
    const existingDeal = await db.deal.findFirst({
      where: {
        contactEmail: { equals: email, mode: "insensitive" },
        source: "ai-operator-collective-application",
        stage: { notIn: ["LOST"] },
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
      // Attribution cookie: was this applicant driven here by a reseller's
      // whitelabel page? Only credit on FIRST deal creation, never on
      // existing-deal update (that path keeps whatever attribution already
      // exists — a first-touch wins rule).
      const referringResellerId = await getValidatedAttributionResellerId(db)

      deal = await db.deal
        .create({
          data: {
            contactName: name,
            contactEmail: email,
            phone,
            referringResellerId,
            source: "ai-operator-collective-application",
            sourceDetail: `Collective application. Score: ${normalizedScore}. Tier: ${tier}. Country: ${country}.${referringResellerId ? " [attributed via cookie]" : ""}`,
            channelTag: referringResellerId ? "reseller" : (utmSource ?? source ?? "organic"),
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

    // Critical: the Deal is what makes this applicant visible in the admin
    // CRM. If the Deal write failed we have either a phantom submission
    // (admin never sees them) or nothing at all. Return 500 so the form
    // shows a real error and the applicant can try again, and so the
    // failure surfaces in Vercel logs instead of being swept away.
    if (!deal) {
      logger.error(
        `apply: Deal creation failed for ${email} — applicant will NOT surface in CRM`,
        null,
        { action: "apply_deal_write_failed", endpoint: "POST /api/community/apply" }
      )
      return NextResponse.json(
        {
          error:
            "We couldn't save your application. Please try again or email noreply@aioperatorcollective.com if this keeps happening.",
        },
        { status: 500 }
      )
    }

    // Mark any partial application for this email as completed so the
    // abandoned-application cron stops targeting them.
    db.partialApplication
      .updateMany({
        where: { email, completedAt: null },
        data: { completedAt: new Date(), dealId: deal.id },
      })
      .catch((err) =>
        logger.error("Failed to mark partial application as completed", err)
      )

    // Email drips only queue AFTER the applicant books a call (see Calendly
    // webhook). If they never book, the nurture-unbooked cron handles day
    // 2/5/9 booking reminders. No drip fires at apply-submit time — the
    // prospect hasn't proven intent yet.

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

    // Push the applicant into Close as an AOC-tagged lead. This runs
    // async (no await) so apply response stays fast; errors are logged.
    // createCloseLead auto-stamps BTC Business Line = AOC so Stephen's
    // shared-workspace automation recognises it as ours.
    if (process.env.CLOSE_API_KEY) {
      createCloseLead({
        contactName: name,
        contactEmail: email,
        phone,
        source: `ai-operator-collective-application (${tier})`,
        dealId: deal.id,
      })
        .then((closeLeadId) => {
          if (closeLeadId) {
            db.deal
              .update({
                where: { id: deal.id },
                data: { closeLeadId },
              })
              .catch((err) =>
                logger.error("Failed to persist closeLeadId", err, {
                  action: "apply_close_persist_id",
                })
              )
          }
        })
        .catch((err) =>
          logger.error("Failed to create Close lead from apply", err, {
            action: "apply_close_create",
          })
        )
    }

    return NextResponse.json({ ok: true, score: normalizedScore, tier }, { status: 201 })
  } catch (err) {
    logger.error("Application submission failed", err, {
      endpoint: "POST /api/community/apply",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
