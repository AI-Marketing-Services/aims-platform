import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getMemberByEmail } from "@/lib/mighty"
import type { MightyWebhookEvent } from "@/lib/mighty/types"

/**
 * POST /api/webhooks/mighty
 *
 * Configure in Mighty Networks Admin > Settings > Integrations > Webhooks:
 *   URL:     https://www.aioperatorcollective.com/api/webhooks/mighty
 *   API Key: paste the value of MIGHTY_WEBHOOK_SECRET here. Mighty will send
 *            this back to us as `Authorization: Bearer <key>` on every event.
 *   Events:  MemberJoined, MemberLeft, MemberCourseProgressCompleted,
 *            MemberPurchased.
 *
 * Auth model — Mighty does NOT sign webhook bodies (unlike Stripe/Calendly).
 * Their auth is Bearer-token: the API Key configured in their dashboard is
 * sent in the Authorization header on every callback. We compare it against
 * MIGHTY_WEBHOOK_SECRET in constant time.
 *
 * For backwards-compat with any older Mighty signed-webhook setup, we also
 * still accept an HMAC-SHA256 signature in `x-mighty-signature` /
 * `x-signature` if present — but the modern path is Bearer auth.
 */

function verifyAuth(raw: string, req: NextRequest): boolean {
  const secret = process.env.MIGHTY_WEBHOOK_SECRET
  if (!secret) {
    // Fail-closed ALWAYS when secret is missing. Previously had a dev/preview
    // bypass that was exploitable from any preview deploy without the env var
    // set — security audit C2. Local dev should set MIGHTY_WEBHOOK_SECRET in
    // .env.local like every other webhook secret.
    logger.error(
      "MIGHTY_WEBHOOK_SECRET is not configured — refusing webhook",
      null,
      { action: "webhook" }
    )
    return false
  }

  // Path A — Bearer-token auth (Mighty's actual model). The Authorization
  // header is "Bearer <secret>" and we compare against the env in constant
  // time so we don't leak via timing whether the prefix matched or not.
  const authHeader = req.headers.get("authorization")
  if (authHeader) {
    const presented = authHeader.replace(/^Bearer\s+/i, "")
    if (presented.length === secret.length) {
      try {
        if (
          crypto.timingSafeEqual(
            Buffer.from(presented),
            Buffer.from(secret),
          )
        ) {
          return true
        }
      } catch {
        // length-mismatch falls through to false
      }
    }
  }

  // Path B — HMAC signature fallback for any legacy Mighty install that
  // signs the body. Most Mighty tenants don't do this; harmless to keep.
  const signatureHeader =
    req.headers.get("x-mighty-signature") ??
    req.headers.get("x-signature") ??
    null
  if (signatureHeader) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex")
    const presented = signatureHeader.replace(/^sha256=/, "")
    if (presented.length === expected.length) {
      try {
        if (
          crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(presented),
          )
        ) {
          return true
        }
      } catch {
        // fall through
      }
    }
  }

  return false
}

export async function POST(req: NextRequest) {
  const raw = await req.text()

  if (!verifyAuth(raw, req)) {
    logger.warn("[Mighty Webhook] Invalid auth", { action: "webhook" })
    return NextResponse.json({ error: "Invalid auth" }, { status: 401 })
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
