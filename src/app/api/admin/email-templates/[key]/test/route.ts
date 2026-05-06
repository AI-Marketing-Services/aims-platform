import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getTemplateEntry } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  /**
   * Recipient for the test send. Defaults to the admin's own Clerk
   * email so the team can never accidentally test-send to a real client.
   */
  to: z.string().email().optional(),
})

/**
 * POST /api/admin/email-templates/[key]/test
 *
 * Fires a real test send for a template using the catalog's sample()
 * factory to fill in the args. Override (if saved) gets applied via
 * the standard sendTrackedEmail override hook — so the test send
 * shows EXACTLY what production would render.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { key } = await params
  const entry = getTemplateEntry(key)
  if (!entry) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 404 })
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine — we'll default to the admin's own email
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Default to the signed-in admin's Clerk email so we never accidentally
  // test-send to a customer.
  let recipient = parsed.data.to
  if (!recipient) {
    const me = await currentUser()
    recipient = me?.emailAddresses?.[0]?.emailAddress ?? ""
    if (!recipient) {
      return NextResponse.json(
        { error: "Could not resolve recipient — set 'to' in the request body" },
        { status: 400 },
      )
    }
  }

  try {
    const args = entry.sample(recipient)
    const result = await entry.send(args)
    return NextResponse.json({ ok: true, recipient, result })
  } catch (err) {
    logger.error("Test send failed", err, {
      templateKey: key,
      recipient,
    })
    const message = err instanceof Error ? err.message : "Test send failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
