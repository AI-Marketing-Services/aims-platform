import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { queueEmailSequence } from "@/lib/email/queue"

const schema = z.object({
  role: z.enum(["ADMIN", "SUPER_ADMIN", "INTERN", "RESELLER", "CLIENT"]),
})

/**
 * Promote / demote a Clerk user. Writes publicMetadata.role on the Clerk
 * side so middleware picks it up on the next request, and mirrors to
 * our Neon User table so server components have a stable source of
 * truth.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: actingUserId, sessionClaims } = await auth()
  if (!actingUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actingRole = (sessionClaims?.metadata as { role?: string })?.role
  if (!actingRole || !["ADMIN", "SUPER_ADMIN"].includes(actingRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId: targetClerkId } = await params

  // Don't let an admin demote themselves into a non-admin role — a
  // simple safety to prevent locking yourself out.
  if (targetClerkId === actingUserId) {
    return NextResponse.json(
      { error: "Cannot change your own role from this UI" },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Privilege-escalation guard: only SUPER_ADMIN may grant SUPER_ADMIN.
  // Without this, any compromised/disgruntled ADMIN could promote a
  // second account they control to SUPER_ADMIN and gain account-wide
  // control (bootstrap secrets, plan grants, role mutations, etc).
  if (parsed.data.role === "SUPER_ADMIN" && actingRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only SUPER_ADMIN can grant SUPER_ADMIN role" },
      { status: 403 },
    )
  }

  try {
    const clerk = await clerkClient()

    // 1. Update Clerk publicMetadata — middleware reads this.
    const target = await clerk.users.updateUserMetadata(targetClerkId, {
      publicMetadata: { role: parsed.data.role },
    })

    // 2. Mirror to our Neon User row so server components agree. Create
    //    the row if it doesn't exist yet (common case: brand-new Clerk
    //    account that hasn't hit any app page that would have created it).
    const email =
      target.emailAddresses.find((e) => e.id === target.primaryEmailAddressId)
        ?.emailAddress ?? target.emailAddresses[0]?.emailAddress

    if (email) {
      const name = [target.firstName, target.lastName].filter(Boolean).join(" ") || null
      await db.user.upsert({
        where: { clerkId: targetClerkId },
        create: {
          clerkId: targetClerkId,
          email,
          name,
          role: parsed.data.role,
        },
        update: {
          role: parsed.data.role,
          email,
          name: name ?? undefined,
        },
      })
    }

    logger.info(`Role updated: ${targetClerkId} -> ${parsed.data.role} by ${actingUserId}`, {
      action: "admin_role_update",
    })

    // Enroll new CLIENT members in the onboarding email sequence
    if (parsed.data.role === "CLIENT" && email) {
      const firstName = target.firstName ?? undefined
      queueEmailSequence(email, "post-purchase", {
        firstName,
        source: "admin_role_assignment",
      }).catch((err) => logger.error("Failed to queue post-purchase sequence", err, { email }))
    }

    return NextResponse.json({ ok: true, userId: targetClerkId, role: parsed.data.role })
  } catch (err) {
    logger.error(`Role update failed for ${targetClerkId}`, err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
