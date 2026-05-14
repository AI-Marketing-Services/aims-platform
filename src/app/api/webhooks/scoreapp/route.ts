import crypto from "crypto"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify, notifyNewLead } from "@/lib/notifications"
import { queueEmailSequence } from "@/lib/email/queue"
import {
  getScoreappSequenceKey,
  normalizeScoreappArchetype,
  sendScoreappFitResultsEmail,
  type ScoreappDimensionScore,
} from "@/lib/email/scoreapp-ai-operator-fit"

export const maxDuration = 30

const payloadSchema = z.record(z.unknown())
const emailSchema = z.string().email()

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (!isAuthorized(req, rawBody)) {
    logger.error("ScoreApp webhook unauthorized", undefined, {
      endpoint: "POST /api/webhooks/scoreapp",
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = payloadSchema.parse(JSON.parse(rawBody))
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const normalized = normalizePayload(payload)
  const parsedEmail = emailSchema.safeParse(normalized.email)
  if (!parsedEmail.success) {
    return NextResponse.json({ error: "Missing valid email" }, { status: 400 })
  }

  const eventUri = `scoreapp:${normalized.eventId ?? sha256(rawBody)}`

  try {
    await db.webhookEvent.create({
      data: { source: "scoreapp", eventUri },
    })
  } catch {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    const archetype = normalizeScoreappArchetype(normalized.archetype)
    const archetypeLabel = normalized.archetypeLabel ?? labelForArchetype(archetype)
    const sequenceKey = getScoreappSequenceKey(archetype)
    const lead = leadScoreForArchetype(archetype)
    const resultsJson: Prisma.InputJsonObject = {
      archetype,
      archetypeLabel,
      dimensions: normalized.dimensions as unknown as Prisma.InputJsonValue,
      ...(normalized.resultsUrl ? { resultsUrl: normalized.resultsUrl } : {}),
    }

    const submission = await db.leadMagnetSubmission.create({
      data: {
        type: "SCOREAPP_AI_OPERATOR_FIT",
        email: parsedEmail.data,
        name: normalized.name,
        phone: normalized.phone,
        data: payload as Prisma.InputJsonObject,
        results: resultsJson,
        score: normalized.score,
        source: "scoreapp",
        utmSource: normalized.utmSource,
        utmMedium: normalized.utmMedium,
        utmCampaign: normalized.utmCampaign,
        emailSequenceStarted: true,
      },
    })

    const deal = await db.deal.create({
      data: {
        contactName: normalized.name ?? parsedEmail.data.split("@")[0],
        contactEmail: parsedEmail.data,
        phone: normalized.phone,
        source: "scoreapp-ai-operator-fit",
        sourceDetail: `${archetypeLabel} scorecard completion. ${lead.reason}`,
        channelTag: normalized.utmSource ?? "scoreapp",
        utmSource: normalized.utmSource,
        utmMedium: normalized.utmMedium,
        utmCampaign: normalized.utmCampaign,
        value: 0,
        leadScore: lead.score,
        leadScoreTier: lead.tier,
        leadScoreReason: lead.reason,
        priority: lead.priority,
        stage: "APPLICATION_SUBMITTED",
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `ScoreApp AI Operator Fit completed. Archetype: ${archetypeLabel}.`,
          },
        },
      },
    }).catch((err) => {
      logger.error("Failed to create ScoreApp deal", err)
      return null
    })

    if (deal) {
      await db.leadMagnetSubmission.update({
        where: { id: submission.id },
        data: { convertedToDeal: true, dealId: deal.id },
      }).catch((err) => logger.error("Failed to link ScoreApp submission to deal", err))

      await db.dealActivity.create({
        data: {
          dealId: deal.id,
          type: "NOTE_ADDED",
          detail: buildScoreappCrmSummary(normalized),
          metadata: buildScoreappCrmMetadata(normalized) as unknown as Prisma.InputJsonObject,
        },
      }).catch((err) => logger.error("Failed to add ScoreApp answers to CRM deal", err))

      await notifyNewLead({
        contactName: normalized.name ?? parsedEmail.data,
        contactEmail: parsedEmail.data,
        source: "scoreapp-ai-operator-fit",
        channelTag: normalized.utmSource ?? "scoreapp",
      }).catch((err) => logger.error("Failed to notify ScoreApp lead", err))

      if (lead.tier === "hot") {
        await notify({
          type: "hot_lead",
          title: `HOT ScoreApp lead - ${archetypeLabel}`,
          message: `${normalized.name ?? parsedEmail.data} completed the AI Operator Fit scorecard as ${archetypeLabel}.`,
          urgency: "high",
        }).catch((err) => logger.error("Failed to send ScoreApp hot lead notification", err))
      }
    }

    const emailMetadata = {
      firstName: normalized.firstName,
      archetype,
      archetypeLabel,
      resultsUrl: normalized.resultsUrl,
      dimensions: normalized.dimensions,
    }

    await sendScoreappFitResultsEmail({
      to: parsedEmail.data,
      metadata: emailMetadata,
    }).catch((err) => logger.error("Failed to send ScoreApp results email", err))

    await queueEmailSequence(parsedEmail.data, sequenceKey, emailMetadata).catch((err) =>
      logger.error("Failed to queue ScoreApp sequence", err)
    )

    return NextResponse.json({
      received: true,
      submissionId: submission.id,
      archetype,
      sequenceKey,
    })
  } catch (err) {
    logger.error("ScoreApp webhook handler failed", err, {
      endpoint: "POST /api/webhooks/scoreapp",
    })
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }
}

function isAuthorized(req: Request, rawBody: string) {
  const secret = process.env.SCOREAPP_WEBHOOK_SECRET
  if (!secret) return false

  const url = new URL(req.url)
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const headerSecret = req.headers.get("x-scoreapp-secret")
  const querySecret = url.searchParams.get("secret")
  const scoreappSignature = req.headers.get("scoreapp-signature")

  if (scoreappSignature && scoreappSignatureMatches(scoreappSignature, rawBody, secret)) {
    return true
  }

  return [auth, headerSecret, querySecret].some((candidate) =>
    candidate ? timingSafeEqual(candidate, secret) : false
  )
}

function scoreappSignatureMatches(signatureHeader: string, rawBody: string, secret: string) {
  const provided = signatureHeader.trim().replace(/^sha256=/i, "")
  const candidates = new Set<string>()

  candidates.add(hmacHex(rawBody, secret))
  candidates.add(hmacBase64(rawBody, secret))

  try {
    const compactJson = JSON.stringify(JSON.parse(rawBody))
    candidates.add(hmacHex(compactJson, secret))
    candidates.add(hmacBase64(compactJson, secret))
  } catch {
    // Keep the raw-body candidates if ScoreApp ever sends non-JSON.
  }

  for (const expected of candidates) {
    if (timingSafeEqual(provided, expected)) return true
  }

  return false
}

function hmacHex(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex")
}

function hmacBase64(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64")
}

function timingSafeEqual(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

function normalizePayload(payload: Record<string, unknown>) {
  const data = isRecord(payload.data) ? payload.data : payload
  const email = stringAt(data, ["email", "contact.email", "lead.email", "person.email"])
  const firstName = stringAt(data, ["firstName", "first_name", "contact.firstName", "lead.firstName"])
  const lastName = stringAt(data, ["lastName", "last_name", "contact.lastName", "lead.lastName"])
  const name =
    stringAt(data, ["name", "fullName", "full_name", "contact.name", "lead.name"]) ??
    [firstName, lastName].filter(Boolean).join(" ") ??
    undefined

  const dimensions = extractDimensions(data)
  const explicitArchetypeLabel = stringAt(data, [
    "archetype",
    "outcome",
    "result",
    "resultTitle",
    "result_title",
    "category",
    "scorecard.outcome",
    "scorecard.result",
  ])
  const inferredArchetype = inferArchetypeFromDimensions(dimensions)
  const archetypeLabel = explicitArchetypeLabel ?? labelForArchetype(inferredArchetype)

  return {
    eventId: stringAt(data, ["id", "eventId", "event_id", "submissionId", "submission_id", "lead.id"]),
    email,
    firstName: firstName ?? name?.split(/\s+/)[0],
    name: name || undefined,
    phone: stringAt(data, ["phone", "phoneNumber", "phone_number", "contact.phone", "lead.phone"]),
    archetype: explicitArchetypeLabel ?? inferredArchetype,
    archetypeLabel,
    resultsUrl: stringAt(data, [
      "resultsUrl",
      "results_url",
      "resultUrl",
      "result_url",
      "scoreappResultsUrl",
      "scoreapp_results_url",
      "lead.resultsUrl",
      "abandon_email_url",
      "report",
    ]),
    dimensions,
    score: numberAt(data, ["score", "totalScore", "total_score", "total_score.percent", "total_score.denominator10", "result.score"]),
    utmSource: stringAt(data, ["utmSource", "utm_source", "tracking.utm_source"]),
    utmMedium: stringAt(data, ["utmMedium", "utm_medium", "tracking.utm_medium"]),
    utmCampaign: stringAt(data, ["utmCampaign", "utm_campaign", "tracking.utm_campaign"]),
    answers: extractQuizAnswers(data),
    highestCategory: extractCategorySummary(valueAt(data, "highest_category")),
    lowestCategory: extractCategorySummary(valueAt(data, "lowest_category")),
  }
}

function buildScoreappCrmSummary(normalized: ReturnType<typeof normalizePayload>) {
  const parts = [
    `ScoreApp completed: ${normalized.archetypeLabel}`,
    normalized.score !== undefined ? `Score ${normalized.score}` : null,
    normalized.highestCategory ? `Strongest: ${normalized.highestCategory}` : null,
    normalized.lowestCategory ? `Weakest: ${normalized.lowestCategory}` : null,
  ].filter(Boolean)

  return parts.join(" · ")
}

function buildScoreappCrmMetadata(normalized: ReturnType<typeof normalizePayload>) {
  return {
    source: "scoreapp-ai-operator-fit",
    archetype: normalized.archetype,
    archetypeLabel: normalized.archetypeLabel,
    score: normalized.score ?? null,
    resultsUrl: normalized.resultsUrl ?? null,
    highestCategory: normalized.highestCategory ?? null,
    lowestCategory: normalized.lowestCategory ?? null,
    dimensions: normalized.dimensions,
    answers: normalized.answers,
  }
}

function extractDimensions(payload: Record<string, unknown>): ScoreappDimensionScore[] {
  const raw =
    valueAt(payload, "category_scores") ??
    valueAt(payload, "dimensions") ??
    valueAt(payload, "dimensionScores") ??
    valueAt(payload, "dimension_scores") ??
    valueAt(payload, "scores")

  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (!isRecord(item)) return []
      const label =
        stringAt(item, ["label", "name", "title", "dimension"]) ??
        stringAt(item, ["category.title"])
      const score = numberAt(item, ["score", "value", "points", "percent", "denominator10"])
      const tier = stringAt(item, ["tier"])
      return label && typeof score === "number" ? [{ label, score, ...(tier ? { tier } : {}) }] : []
    })
  }

  if (isRecord(raw)) {
    return Object.entries(raw).flatMap(([label, score]) =>
      typeof score === "number" ? [{ label, score }] : []
    )
  }

  return []
}

function extractQuizAnswers(payload: Record<string, unknown>) {
  const raw = valueAt(payload, "quiz_questions")
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (!isRecord(item)) return []
    const question = stringAt(item, ["question", "title", "label"])
    const answersRaw = valueAt(item, "answers")
    const answers = Array.isArray(answersRaw)
      ? answersRaw.flatMap((answer) => {
          if (typeof answer === "string") return [answer]
          if (!isRecord(answer)) return []
          const answerText = stringAt(answer, ["answer", "value", "label", "text"])
          return answerText ? [answerText] : []
        })
      : []

    return question ? [{ question, answers }] : []
  })
}

function extractCategorySummary(value: unknown) {
  if (!isRecord(value)) return undefined
  return stringAt(value, ["title", "name", "category.title"])
}

function inferArchetypeFromDimensions(dimensions: ScoreappDimensionScore[]) {
  const expectation = bandForDimension(dimensions, "expectation")
  if (expectation === "low") return "spectator"

  const commitment = bandForDimension(dimensions, "commitment")
  if (commitment === "low") return "multi-threader"

  const tech = bandForDimension(dimensions, "tech")
  const diagnosis = bandForDimension(dimensions, "diagnosis")
  if (tech === "high" && diagnosis !== "high") return "tinkerer"

  return "diagnostician"
}

function bandForDimension(
  dimensions: ScoreappDimensionScore[],
  labelNeedle: string
): "low" | "medium" | "high" | undefined {
  const match = dimensions.find((dimension) =>
    dimension.label.toLowerCase().includes(labelNeedle)
  )
  if (!match) return undefined

  const tier = match.tier?.toLowerCase()
  if (tier === "low" || tier === "medium" || tier === "high") return tier

  if (match.score < 34) return "low"
  if (match.score >= 67) return "high"
  return "medium"
}

function stringAt(obj: Record<string, unknown>, paths: string[]) {
  for (const path of paths) {
    const value = valueAt(obj, path)
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return undefined
}

function numberAt(obj: Record<string, unknown>, paths: string[]) {
  for (const path of paths) {
    const value = valueAt(obj, path)
    if (typeof value === "number") return value
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return undefined
}

function valueAt(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined
    return current[key]
  }, obj)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function labelForArchetype(archetype: ReturnType<typeof normalizeScoreappArchetype>) {
  switch (archetype) {
    case "tinkerer":
      return "The Tinkerer"
    case "multi-threader":
      return "The Multi-Threader"
    case "spectator":
      return "The Spectator"
    default:
      return "The Diagnostician"
  }
}

function leadScoreForArchetype(archetype: ReturnType<typeof normalizeScoreappArchetype>) {
  switch (archetype) {
    case "diagnostician":
      return {
        score: 82,
        tier: "hot",
        priority: "HIGH" as const,
        reason: "Strong-fit ScoreApp archetype: Diagnostician",
      }
    case "tinkerer":
      return {
        score: 78,
        tier: "hot",
        priority: "HIGH" as const,
        reason: "Strong-fit ScoreApp archetype: Tinkerer",
      }
    case "multi-threader":
      return {
        score: 55,
        tier: "warm",
        priority: "MEDIUM" as const,
        reason: "Nurture-fit ScoreApp archetype: Multi-Threader",
      }
    default:
      return {
        score: 35,
        tier: "cold",
        priority: "LOW" as const,
        reason: "Reset-expectations ScoreApp archetype: Spectator",
      }
  }
}
