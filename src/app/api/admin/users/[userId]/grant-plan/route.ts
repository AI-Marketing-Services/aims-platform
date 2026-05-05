import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { grantPlanToUser } from "@/lib/plans/grant"
import { PLANS } from "@/lib/plans/registry"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  planSlug: z.enum(PLANS.map((p) => p.slug) as [string, ...string[]]),
  skipCredits: z.boolean().optional(),
  note: z.string().max(500).optional(),
})

/**
 * POST /api/admin/users/[userId]/grant-plan
 *
 * Comp a plan to a user without a Stripe charge. Grants entitlements +
 * monthly credits, sets User.planSlug. Idempotent — re-running with the
 * same plan is a no-op except for an additional credit grant ledger row.
 *
 * Body: { planSlug: "free" | "pro" | "operator", skipCredits?: boolean, note?: string }
 *
 * Admin / Super-admin only.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: actingClerkId, sessionClaims } = await auth()
  if (!actingClerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actingRole = (sessionClaims?.metadata as { role?: string })?.role
  if (!actingRole || !["ADMIN", "SUPER_ADMIN"].includes(actingRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await grantPlanToUser(userId, parsed.data.planSlug, {
      skipCredits: parsed.data.skipCredits,
      note: parsed.data.note,
    })
    logger.info(
      `Admin ${actingClerkId} granted plan ${parsed.data.planSlug} to user ${userId}`,
      { action: "admin_grant_plan", target: userId },
    )
    return NextResponse.json(result)
  } catch (err) {
    logger.error("Admin grant-plan failed", err, { userId, actingClerkId })
    const message = err instanceof Error ? err.message : "Grant failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
