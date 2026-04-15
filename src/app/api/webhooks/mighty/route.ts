import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import type { MightyWebhookEvent } from "@/lib/mighty/types"

/**
 * POST /api/webhooks/mighty
 * Inbound webhook handler for Mighty Networks events.
 *
 * Configure in Mighty Networks Admin > Settings > Webhooks:
 *   URL: https://aioperatorcollective.com/api/webhooks/mighty
 *
 * Events we care about:
 *   - MemberJoined: sync to AIMS CRM, send welcome sequence
 *   - MemberLeft: update CRM status
 *   - MemberCourseProgressCompleted: award badge, notify admin
 *   - MemberPurchased: sync subscription to AIMS platform
 */
export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as MightyWebhookEvent

    logger.info(`[Mighty Webhook] ${event.event_type}`, {
      action: "webhook",
      endpoint: "/api/webhooks/mighty",
    })

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
        // Log but don't fail on unhandled events
        logger.info(`[Mighty Webhook] Unhandled event: ${event.event_type}`, {
          action: "webhook_unhandled",
        })
    }

    // Always return 200 to prevent webhook retries
    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error("[Mighty Webhook] Processing failed", err, {
      action: "webhook_error",
    })
    // Still return 200 to prevent retries on our processing errors
    return NextResponse.json({ received: true, error: "processing_failed" })
  }
}

async function handleMemberJoined(event: MightyWebhookEvent): Promise<void> {
  const { data } = event
  const email = data.email as string | undefined
  const name = data.name as string | undefined

  if (!email) return

  logger.info(`[Mighty] New member joined: ${name ?? email}`, {
    action: "member_joined",
  })

  // TODO: Sync to AIMS CRM (create/update deal)
  // TODO: Trigger welcome email sequence via Resend
  // TODO: Add "New Member" tag in Mighty
}

async function handleMemberLeft(event: MightyWebhookEvent): Promise<void> {
  const { data } = event
  const email = data.email as string | undefined

  if (!email) return

  logger.info(`[Mighty] Member left: ${email}`, {
    action: "member_left",
  })

  // TODO: Update CRM status
  // TODO: Trigger win-back email sequence
}

async function handleCourseCompleted(event: MightyWebhookEvent): Promise<void> {
  const { data } = event
  const memberId = data.member_id as number | undefined

  if (!memberId) return

  logger.info(`[Mighty] Course completed by member: ${memberId}`, {
    action: "course_completed",
  })

  // TODO: Award "Course Complete" badge
  // TODO: Notify admin
  // TODO: Trigger congratulations email
}

async function handleMemberPurchased(event: MightyWebhookEvent): Promise<void> {
  const { data } = event
  const email = data.email as string | undefined
  const planId = data.plan_id as number | undefined

  if (!email || !planId) return

  logger.info(`[Mighty] Member purchased plan ${planId}: ${email}`, {
    action: "member_purchased",
  })

  // TODO: Sync subscription to AIMS platform
  // TODO: Update CRM deal stage
  // TODO: Grant appropriate access
}
