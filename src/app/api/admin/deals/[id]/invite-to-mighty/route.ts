import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  provisionCollectiveMember,
  MIGHTY_IDS,
  type MightyErrorBag,
} from "@/lib/mighty"
import { sendCollectiveInviteEmail } from "@/lib/email/collective-invite"

const schema = z.object({
  planId: z.number().int().positive().optional(),
  tier: z.enum(["community", "accelerator", "innerCircle"]).optional(),
  resend: z.boolean().optional(),
  // Optional custom text the admin wants to include at the top of the
  // branded invite email. Left as a short personalised note — full body
  // copy is templated in /lib/email/collective-invite.ts.
  message: z.string().max(1000).optional(),
})

type PlanTier = "community" | "accelerator" | "innerCircle"

function resolvePlan(body: z.infer<typeof schema>): {
  planId: number
  planName: string
  tier: PlanTier
} {
  const tier: PlanTier = body.tier ?? "community"
  const nameMap: Record<PlanTier, string> = {
    community: "Community",
    accelerator: "Accelerator",
    innerCircle: "Inner Circle",
  }
  const planId = body.planId ?? MIGHTY_IDS.plans[tier]
  return { planId, planName: nameMap[tier], tier }
}

/**
 * Invite route. Implements Option C:
 *
 *   1. Provision the member directly in Mighty (createMember +
 *      addMemberToPlan) so they skip the approval queue entirely.
 *   2. Send our own branded Resend email from noreply@aioperatorcollective.com
 *      with a magic-login link. The email is written, designed, and
 *      delivered by us — not by Mighty's baseline template.
 *
 * Benefits over the old `inviteToPlan` flow:
 *   - Applicant does NOT see Mighty's "Pending Approval" screen
 *   - The email they get is on-brand, includes first-steps copy, and
 *     comes from our verified domain (better deliverability)
 *   - Admin sees exact failure reasons in the audit table via errorBag
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const deal = await db.deal.findUnique({ where: { id } })
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }
    if (!deal.contactEmail) {
      return NextResponse.json(
        { error: "Deal is missing contactEmail" },
        { status: 400 }
      )
    }

    const { planId, planName, tier } = resolvePlan(parsed.data)

    // Resend path. In Option C "resend" means "re-send the branded
    // welcome email" — the member is already provisioned on Mighty, so
    // we don't need to hit Mighty again. We just fire the Resend email
    // and bump the resentAt timestamp for the audit record.
    if (parsed.data.resend) {
      const last = await db.mightyInvite.findFirst({
        where: { dealId: id, planId },
        orderBy: { sentAt: "desc" },
      })
      if (!last) {
        return NextResponse.json(
          { error: "No prior invite on this plan to resend" },
          { status: 404 }
        )
      }

      const firstName = (deal.contactName ?? "").trim().split(/\s+/)[0] || null
      const emailResult = await sendCollectiveInviteEmail({
        to: deal.contactEmail,
        firstName,
        tier,
        customMessage: parsed.data.message ?? null,
      })

      if (!emailResult.ok) {
        await db.mightyInvite.update({
          where: { id: last.id },
          data: { errorMessage: emailResult.error ?? "Email resend failed" },
        })
        return NextResponse.json(
          { error: emailResult.error ?? "Email resend failed" },
          { status: 502 }
        )
      }

      const updated = await db.mightyInvite.update({
        where: { id: last.id },
        data: {
          resentAt: new Date(),
          status: last.status === "accepted" ? "accepted" : "sent",
          errorMessage: null,
        },
      })
      await db.dealActivity.create({
        data: {
          dealId: id,
          type: "MIGHTY_INVITE_RESENT",
          detail: `Re-sent ${planName} welcome email to ${deal.contactEmail}`,
          authorId: userId,
          metadata: { planId, method: "branded-email-resend" },
        },
      })
      return NextResponse.json({ ok: true, invite: updated })
    }

    // Dedup on fresh invites. If we already have a sent/accepted invite
    // for this plan, don't re-provision.
    const existing = await db.mightyInvite.findFirst({
      where: {
        dealId: id,
        planId,
        status: { in: ["pending", "sent", "accepted"] },
      },
      orderBy: { sentAt: "desc" },
    })
    if (existing?.status === "accepted") {
      return NextResponse.json(
        { error: "Member has already joined this plan", invite: existing },
        { status: 409 }
      )
    }
    if (existing?.status === "sent") {
      return NextResponse.json(
        {
          error: "Welcome email already sent. Use resend if you need to re-send it.",
          invite: existing,
        },
        { status: 409 }
      )
    }

    const [firstName, ...rest] = (deal.contactName ?? "").trim().split(/\s+/)
    const lastName = rest.join(" ") || null

    // Audit record — create first so failures are still recorded.
    const record = await db.mightyInvite.create({
      data: {
        dealId: id,
        email: deal.contactEmail,
        planId,
        planName,
        status: "pending",
        invitedByClerkId: userId,
      },
    })

    // ── Provision the member in Mighty ─────────────────────────────────
    const provisionErrorBag: MightyErrorBag = { message: "" }
    const result = await provisionCollectiveMember(
      {
        email: deal.contactEmail,
        firstName,
        lastName,
        planId,
      },
      provisionErrorBag
    )

    if (!result) {
      const reason = provisionErrorBag.message || "Mighty provisioning failed"
      await db.mightyInvite.update({
        where: { id: record.id },
        data: { status: "failed", errorMessage: reason },
      })
      await db.deal.update({
        where: { id },
        data: { mightyInviteStatus: "failed" },
      })
      await db.dealActivity.create({
        data: {
          dealId: id,
          type: "MIGHTY_INVITE_FAILED",
          detail: `Failed to provision ${deal.contactEmail} on ${planName}: ${reason}`,
          authorId: userId,
          metadata: { planId, status: provisionErrorBag.status },
        },
      })
      logger.error(
        `[Mighty] provision failed dealId=${id} reason=${reason}`,
        null,
        { action: "provision_collective_member" }
      )
      return NextResponse.json(
        { error: reason, invite: { ...record, errorMessage: reason } },
        { status: 502 }
      )
    }

    // ── Send the branded welcome email ─────────────────────────────────
    // If Mighty provisioning succeeded but email sending fails, we
    // surface that as a retryable state (email-failed) — the member is
    // already inside the community, they just don't know it yet.
    const emailResult = await sendCollectiveInviteEmail({
      to: deal.contactEmail,
      firstName: firstName || null,
      tier,
      customMessage: parsed.data.message ?? null,
    })

    if (!emailResult.ok) {
      const reason = `Member provisioned but welcome email failed: ${emailResult.error ?? "unknown"}`
      await db.mightyInvite.update({
        where: { id: record.id },
        data: {
          status: "failed",
          mightyMemberId: result.member.id,
          errorMessage: reason,
        },
      })
      await db.deal.update({
        where: { id },
        data: {
          mightyInviteStatus: "failed",
          mightyMemberId: result.member.id,
        },
      })
      await db.dealActivity.create({
        data: {
          dealId: id,
          type: "MIGHTY_INVITE_FAILED",
          detail: reason,
          authorId: userId,
          metadata: { planId, mightyMemberId: result.member.id },
        },
      })
      return NextResponse.json(
        { error: reason, invite: { ...record, errorMessage: reason } },
        { status: 502 }
      )
    }

    // ── Success path ───────────────────────────────────────────────────
    const updated = await db.mightyInvite.update({
      where: { id: record.id },
      data: {
        status: "sent",
        mightyMemberId: result.member.id,
        errorMessage: null,
      },
    })
    await db.deal.update({
      where: { id },
      data: {
        mightyInviteStatus: "pending",
        mightyMemberId: result.member.id,
      },
    })
    await db.dealActivity.create({
      data: {
        dealId: id,
        type: "MIGHTY_INVITE_SENT",
        detail: `${result.createdMember ? "Provisioned new" : "Added existing"} member ${deal.contactEmail} to ${planName}; branded welcome email sent.`,
        authorId: userId,
        metadata: {
          planId,
          mightyMemberId: result.member.id,
          createdMember: result.createdMember,
          alreadyOnPlan: result.alreadyOnPlan,
          method: "direct-provision",
        },
      },
    })

    return NextResponse.json({
      ok: true,
      invite: updated,
      mightyMemberId: result.member.id,
      createdMember: result.createdMember,
      alreadyOnPlan: result.alreadyOnPlan,
    })
  } catch (err) {
    logger.error(`[Mighty] invite-to-mighty POST failed dealId=${id}`, err)
    return NextResponse.json(
      { error: "Invite operation failed" },
      { status: 500 }
    )
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params
    const invites = await db.mightyInvite.findMany({
      where: { dealId: id },
      orderBy: { sentAt: "desc" },
    })
    return NextResponse.json({ invites })
  } catch (err) {
    logger.error("[Mighty] invite-to-mighty GET failed", err)
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    )
  }
}
