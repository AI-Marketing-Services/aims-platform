import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getMemberByEmail } from "@/lib/mighty"
import type { MightyWebhookEvent } from "@/lib/mighty/types"

/**
 * POST /api/webhooks/mighty
 *
 * Configure in Mighty Networks Admin > Settings > Webhooks:
 *   URL:    https://aioperatorcollective.com/api/webhooks/mighty
 *   Secret: set MIGHTY_WEBHOOK_SECRET env var to the same value
 *
 * Handled events: MemberJoined, MemberLeft, MemberCourseProgressCompleted,
 * MemberPurchased.
 */

function verifySignature(raw: string, signatureHeader: string | null): boolean {
  const secret = process.env.MIGHTY_WEBHOOK_SECRET
  if (!secret) {
    // Fail-closed in production: refuse unsigned webhooks if no secret is set.
    // Allow in dev so local testing without Mighty config still works.
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "MIGHTY_WEBHOOK_SECRET is not configured — refusing webhook in production",
        null,
        { action: "webhook" }
      )
      return false
    }
    return true
  }
  if (!signatureHeader) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader.replace(/^sha256=/, ""))
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature =
    req.headers.get("x-mighty-signature") ??
    req.headers.get("x-signature") ??
    null

  if (!verifySignature(raw, signature)) {
    logger.warn("[Mighty Webhook] Invalid signature", { action: "webhook" })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: MightyWebhookEvent
  try {
    event = JSON.parse(raw) as MightyWebhookEvent
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  logger.info(`[Mighty Webhook] ${event.event_type}`, {
    action: "webhook",
    endpoint: "/api/webhooks/mighty",
  })

  try {
    switch (event.event_type) {
      case "MemberJoined":
        await handleMemberJoined(event)
        break
      case "MemberLeft":
        await handleMemberLeft(event)
        break
      case "MemberCourseProgressCompleted":
        await handleCourseCompleted(event)
        break
      case "MemberPurchased":
        await handleMemberPurchased(event)
        break
      default:
        logger.info(`[Mighty Webhook] Unhandled event: ${event.event_type}`, {
          action: "webhook_unhandled",
        })
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    // Return 500 so Mighty retries; also log for visibility
    logger.error("[Mighty Webhook] Handler failed", err, {
      action: "webhook_error",
      endpoint: "/api/webhooks/mighty",
    })
    return NextResponse.json(
      { received: false, error: "handler_failed" },
      { status: 500 }
    )
  }
}

type MemberEventData = {
  email?: string
  name?: string
  first_name?: string
  last_name?: string
  member_id?: number
  plan_id?: number
  plan_name?: string
  course_id?: number
  course_name?: string
}

async function findDealByEmail(email: string) {
  // Case-insensitive lookup; contactEmail is stored lower-case in apply flow
  return db.deal.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  })
}

async function handleMemberJoined(event: MightyWebhookEvent): Promise<void> {
  const data = event.data as MemberEventData
  const email = data.email
  if (!email) return

  // Try to resolve mighty member ID if not provided
  let mightyMemberId = data.member_id ?? null
  if (!mightyMemberId) {
    const member = await getMemberByEmail(email)
    mightyMemberId = member?.id ?? null
  }

  // Find any pending invite for this email
  const invite = await db.mightyInvite.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { sentAt: "desc" },
  })

  if (invite) {
    await db.mightyInvite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        mightyMemberId: mightyMemberId ?? undefined,
      },
    })
  }

  // Find deal via invite or fallback email match
  const deal = invite
    ? await db.deal.findUnique({ where: { id: invite.dealId } })
    : await findDealByEmail(email)

  if (deal) {
    // Member accepted their invite -> they've actually joined. Bump any
    // pre-MEMBER_JOINED stage forward so the kanban reflects reality.
    const preJoinedStages: string[] = [
      "APPLICATION_SUBMITTED",
      "CONSULT_BOOKED",
      "CONSULT_COMPLETED",
      "MIGHTY_INVITED",
    ]
    const nextStage = preJoinedStages.includes(deal.stage)
      ? "MEMBER_JOINED"
      : deal.stage
    await db.deal.update({
      where: { id: deal.id },
      data: {
        mightyInviteStatus: "accepted",
        mightyMemberId: mightyMemberId ?? undefined,
        stage: nextStage,
      },
    })
    await db.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "MIGHTY_MEMBER_JOINED",
        detail: `${data.name ?? email} joined the Collective`,
        metadata: {
          mightyMemberId,
          email,
          receivedAt: new Date().toISOString(),
        },
      },
    })
  } else {
    // Member joined without a matching deal — still log for visibility
    logger.info(
      `[Mighty] Member joined without matching deal: ${email}`,
      { action: "member_joined_no_deal" }
    )
  }
}

async function handleMemberLeft(event: MightyWebhookEvent): Promise<void> {
  const data = event.data as MemberEventData
  const email = data.email
  if (!email) return

  const deal = await findDealByEmail(email)
  if (!deal) return

  await db.deal.update({
    where: { id: deal.id },
    data: {
      mightyInviteStatus: "accepted", // leave history
      stage: deal.stage === "MEMBER_JOINED" ? "LOST" : deal.stage,
    },
  })
  await db.dealActivity.create({
    data: {
      dealId: deal.id,
      type: "MIGHTY_MEMBER_LEFT",
      detail: `${email} left the Collective`,
      metadata: { email, receivedAt: new Date().toISOString() },
    },
  })
}

async function handleCourseCompleted(event: MightyWebhookEvent): Promise<void> {
  const data = event.data as MemberEventData
  const email = data.email
  const memberId = data.member_id
  const courseName = data.course_name ?? "a course"

  // Prefer email lookup; fall back to member_id via MightyInvite
  let deal = email ? await findDealByEmail(email) : null
  if (!deal && memberId) {
    const invite = await db.mightyInvite.findFirst({
      where: { mightyMemberId: memberId },
      orderBy: { sentAt: "desc" },
    })
    if (invite) {
      deal = await db.deal.findUnique({ where: { id: invite.dealId } })
    }
  }
  if (!deal) return

  await db.dealActivity.create({
    data: {
      dealId: deal.id,
      type: "MIGHTY_COURSE_COMPLETED",
      detail: `Completed ${courseName}`,
      metadata: {
        memberId,
        email,
        courseId: data.course_id,
        courseName,
        receivedAt: new Date().toISOString(),
      },
    },
  })
}

async function handleMemberPurchased(event: MightyWebhookEvent): Promise<void> {
  const data = event.data as MemberEventData
  const email = data.email
  const planId = data.plan_id
  if (!email || !planId) return

  const deal = await findDealByEmail(email)
  if (!deal) return

  await db.dealActivity.create({
    data: {
      dealId: deal.id,
      type: "MIGHTY_PLAN_PURCHASED",
      detail: `Purchased ${data.plan_name ?? `plan ${planId}`}`,
      metadata: {
        email,
        planId,
        planName: data.plan_name,
        receivedAt: new Date().toISOString(),
      },
    },
  })

  // Any Mighty-plan purchase implies the user joined the community, so bump
  // earlier funnel stages forward.
  const preJoinedStages: string[] = [
    "APPLICATION_SUBMITTED",
    "CONSULT_BOOKED",
    "CONSULT_COMPLETED",
    "MIGHTY_INVITED",
  ]
  if (preJoinedStages.includes(deal.stage)) {
    await db.deal.update({
      where: { id: deal.id },
      data: { stage: "MEMBER_JOINED" },
    })
  }
}
