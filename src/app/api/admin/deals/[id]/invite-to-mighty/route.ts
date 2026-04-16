import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { inviteToPlan, resendInvite, MIGHTY_IDS, getPlan } from "@/lib/mighty"

const schema = z.object({
  planId: z.number().int().positive().optional(),
  tier: z.enum(["community", "accelerator", "innerCircle"]).optional(),
  resend: z.boolean().optional(),
})

type PlanTier = "community" | "accelerator" | "innerCircle"

function resolvePlanId(body: z.infer<typeof schema>): { planId: number; planName: string } {
  if (body.planId) {
    return { planId: body.planId, planName: `plan ${body.planId}` }
  }
  const tier: PlanTier = body.tier ?? "community"
  const planId = MIGHTY_IDS.plans[tier]
  const nameMap: Record<PlanTier, string> = {
    community: "Community",
    accelerator: "Accelerator",
    innerCircle: "Inner Circle",
  }
  return { planId, planName: nameMap[tier] }
}

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
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  const deal = await db.deal.findUnique({ where: { id } })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }
  if (!deal.contactEmail) {
    return NextResponse.json({ error: "Deal is missing contactEmail" }, { status: 400 })
  }

  const { planId, planName } = resolvePlanId(parsed.data)

  // Resend path — reuse last invite for this deal+plan
  if (parsed.data.resend) {
    const last = await db.mightyInvite.findFirst({
      where: { dealId: id, planId },
      orderBy: { sentAt: "desc" },
    })
    if (last?.mightyInviteId) {
      const ok = await resendInvite(last.mightyInviteId)
      if (!ok) {
        return NextResponse.json({ error: "Resend failed" }, { status: 502 })
      }
      const updated = await db.mightyInvite.update({
        where: { id: last.id },
        data: { resentAt: new Date(), status: "sent" },
      })
      await db.dealActivity.create({
        data: {
          dealId: id,
          type: "MIGHTY_INVITE_RESENT",
          detail: `Resent ${planName} invite to ${deal.contactEmail}`,
          authorId: userId,
          metadata: { planId, mightyInviteId: last.mightyInviteId },
        },
      })
      return NextResponse.json({ ok: true, invite: updated })
    }
    return NextResponse.json({ error: "No prior invite found to resend" }, { status: 404 })
  }

  // Dedupe: don't double-invite if there's a pending/sent/accepted record for same plan
  const existing = await db.mightyInvite.findFirst({
    where: {
      dealId: id,
      planId,
      status: { in: ["pending", "sent", "accepted"] },
    },
    orderBy: { sentAt: "desc" },
  })
  if (existing && existing.status === "accepted") {
    return NextResponse.json(
      { error: "Prospect has already accepted this invite", invite: existing },
      { status: 409 }
    )
  }
  if (existing && existing.status !== "failed") {
    return NextResponse.json(
      { error: "Invite already sent. Use resend instead.", invite: existing },
      { status: 409 }
    )
  }

  const [firstName, ...rest] = (deal.contactName ?? "").trim().split(/\s+/)
  const lastName = rest.join(" ") || undefined

  // Pre-write record so failures are audited too
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

  // Verify plan is reachable (optional sanity; catches misconfigured token fast)
  const plan = await getPlan(planId)
  if (!plan) {
    await db.mightyInvite.update({
      where: { id: record.id },
      data: { status: "failed", errorMessage: "Plan not found or token invalid" },
    })
    await db.dealActivity.create({
      data: {
        dealId: id,
        type: "MIGHTY_INVITE_FAILED",
        detail: `Could not resolve plan ${planId} (${planName})`,
        authorId: userId,
        metadata: { planId },
      },
    })
    return NextResponse.json({ error: "Plan unreachable", invite: record }, { status: 502 })
  }

  const invite = await inviteToPlan(planId, {
    recipient_email: deal.contactEmail,
    recipient_first_name: firstName || undefined,
    recipient_last_name: lastName,
  })

  if (!invite) {
    await db.mightyInvite.update({
      where: { id: record.id },
      data: { status: "failed", errorMessage: "Mighty API call failed" },
    })
    await db.deal.update({
      where: { id },
      data: { mightyInviteStatus: "failed" },
    })
    await db.dealActivity.create({
      data: {
        dealId: id,
        type: "MIGHTY_INVITE_FAILED",
        detail: `Failed to invite ${deal.contactEmail} to ${planName}`,
        authorId: userId,
        metadata: { planId },
      },
    })
    logger.error(`[Mighty] invite failed dealId=${id}`, null, {
      action: "invite_to_mighty",
    })
    return NextResponse.json({ error: "Invite failed", invite: record }, { status: 502 })
  }

  const updated = await db.mightyInvite.update({
    where: { id: record.id },
    data: {
      status: "sent",
      mightyInviteId: (invite as { id?: number }).id ?? null,
    },
  })
  await db.deal.update({
    where: { id },
    data: { mightyInviteStatus: "pending" },
  })
  await db.dealActivity.create({
    data: {
      dealId: id,
      type: "MIGHTY_INVITE_SENT",
      detail: `Invited ${deal.contactEmail} to ${planName}`,
      authorId: userId,
      metadata: {
        planId,
        mightyInviteId: (invite as { id?: number }).id,
      },
    },
  })

  return NextResponse.json({ ok: true, invite: updated, mightyInvite: invite })
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
  const { id } = await params
  const invites = await db.mightyInvite.findMany({
    where: { dealId: id },
    orderBy: { sentAt: "desc" },
  })
  return NextResponse.json({ invites })
}
