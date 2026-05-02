import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp, rateLimitedResponse } from "@/lib/ratelimit"
import { createLeadMagnetSubmission } from "@/lib/db/queries"
import { createCloseLead } from "@/lib/close"
import { notifyNewLead } from "@/lib/notifications"
import { getValidatedAttributionResellerId } from "@/lib/tenant/attribution"
import { logger } from "@/lib/logger"
import { runDigestForSubscriber } from "@/lib/signal/digest"

const topicSchema = z.object({
  label: z.string().trim().min(1).max(60),
  query: z.string().trim().min(1).max(200),
})

const submitSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  topics: z.array(topicSchema).min(1).max(5),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

/**
 * POST /api/lead-magnets/daily-signal
 * Public subscribe endpoint for the Daily Signal lead magnet.
 * 1. Upsert SignalSubscriber keyed by email
 * 2. Create LeadMagnetSubmission + Deal
 * 3. Push to Close CRM (AOC-partitioned)
 * 4. Fire an immediate digest run so the user gets value in <60s
 */
export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) return rateLimitedResponse(req, "POST /api/lead-magnets/daily-signal")
  }

  try {
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, name, topics, source, utmSource, utmMedium, utmCampaign } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Upsert subscriber (topics replace on re-subscribe, status reactivates)
    const subscriber = await db.signalSubscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: name?.trim() || null,
        topics: topics as unknown as object,
        source: source ?? utmSource ?? null,
        utmCampaign: utmCampaign ?? null,
        status: "ACTIVE",
      },
      update: {
        name: name?.trim() || undefined,
        topics: topics as unknown as object,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    })

    // 2. Lead-magnet submission
    const submission = await createLeadMagnetSubmission({
      type: "DAILY_SIGNAL",
      email: normalizedEmail,
      name: name?.trim() || undefined,
      data: { topics, subscriberId: subscriber.id },
      source: source ?? "daily-signal",
      utmSource,
      utmMedium,
      utmCampaign,
    })

    // 3. Deal — warm tier: high-intent content signal
    const leadScore = 66
    const tier = "warm" as const
    const reason = `Daily Signal subscribed with ${topics.length} topic${topics.length === 1 ? "" : "s"} — content-stage lead, strong AI interest signal`

    const referringResellerId = await getValidatedAttributionResellerId(db)

    const deal = await db.deal
      .create({
        data: {
          contactName: name?.trim() || normalizedEmail.split("@")[0],
          contactEmail: normalizedEmail,
          referringResellerId,
          source: "daily-signal",
          sourceDetail: `Score: ${leadScore}/100 (${tier}). ${reason}${referringResellerId ? " [attributed via cookie]" : ""}`,
          channelTag: referringResellerId ? "reseller" : (utmSource ?? "organic"),
          utmSource,
          utmMedium,
          utmCampaign,
          value: 0,
          leadScore,
          leadScoreTier: tier,
          leadScoreReason: reason,
          priority: "MEDIUM",
          stage: "APPLICATION_SUBMITTED",
          activities: {
            create: {
              type: "FORM_SUBMITTED",
              detail: `Daily Signal subscribed. Topics: ${topics.map((t) => t.label).join(", ")}. Score: ${leadScore}/100 (${tier}).`,
            },
          },
        },
      })
      .catch((e) => {
        logger.error("Failed to create deal from Daily Signal subscribe", e)
        return null
      })

    if (deal) {
      await db.leadMagnetSubmission
        .update({ where: { id: submission.id }, data: { convertedToDeal: true, dealId: deal.id } })
        .catch((e) => logger.error("Failed to link Daily Signal submission to deal", e))

      notifyNewLead({
        contactName: name?.trim() || normalizedEmail,
        contactEmail: normalizedEmail,
        source: "daily-signal",
        channelTag: utmSource,
      }).catch((e) => logger.error("Failed to notify new Daily Signal lead", e))

      // 4. Close CRM sync (AOC-partitioned)
      createCloseLead({
        contactName: name?.trim() || normalizedEmail,
        contactEmail: normalizedEmail,
        source: "daily-signal",
        dealId: deal.id,
      })
        .then((closeLeadId) => {
          if (closeLeadId) {
            db.deal
              .update({ where: { id: deal.id }, data: { closeLeadId } })
              .catch((e) => logger.error("Failed to persist closeLeadId on Daily Signal deal", e))
          }
        })
        .catch((e) => logger.error("Failed to sync Daily Signal lead to Close", e))
    }

    // 5. Fire immediate digest run (fire-and-forget — user gets value fast)
    runDigestForSubscriber(subscriber.id).catch((e) =>
      logger.error("Immediate Signal digest failed for new subscriber", { subscriberId: subscriber.id, e }),
    )

    return NextResponse.json(
      {
        id: submission.id,
        subscriberId: subscriber.id,
        message: "You're subscribed. First digest is running now.",
      },
      { status: 201 },
    )
  } catch (err) {
    logger.error("Daily Signal subscribe failed", err, { endpoint: "POST /api/lead-magnets/daily-signal" })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
