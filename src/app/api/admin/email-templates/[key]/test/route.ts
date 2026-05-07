import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getTemplateEntry } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  /**
   * Recipient for the test send. Optional in the request body for backwards
   * compatibility, but the handler ALWAYS overrides it with the signed-in
   * admin's Clerk email. Locking this prevents the editor from being weaponised
   * to send arbitrary HTML from our verified Resend domain to any external
   * address (deliverability + reputation risk).
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

  // ALWAYS resolve recipient to the signed-in admin's Clerk email. Ignore
  // the body's `to` field — the editor field exists for UX (admin sees what
  // address the test will hit) but the server never trusts it. Without this
  // an authenticated admin (or attacker with a stolen session) could send
  // crafted phishing HTML from our verified Resend domain to any external
  // recipient — abusing our deliverability reputation.
  const me = await currentUser()
  // Use primaryEmailAddress — emailAddresses[0] points to whichever email
  // was added first, which may not be the user's primary inbox if they
  // changed it later. primaryEmailAddress is the stable canonical reference.
  const adminEmail =
    me?.primaryEmailAddress?.emailAddress ??
    me?.emailAddresses?.[0]?.emailAddress ??
    ""
  if (!adminEmail) {
    return NextResponse.json(
      { error: "Could not resolve your Clerk email — re-sign-in and retry." },
      { status: 400 },
    )
  }
  if (parsed.data.to && parsed.data.to.toLowerCase() !== adminEmail.toLowerCase()) {
    logger.warn("Test send 'to' override ignored — locked to admin email", {
      attempted: parsed.data.to,
      adminEmail,
      templateKey: key,
    })
  }
  const recipient = adminEmail

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
