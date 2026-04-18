import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const schema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "SUPER_ADMIN", "INTERN", "RESELLER", "CLIENT"]),
  firstName: z.string().trim().max(60).optional().nullable(),
  lastName: z.string().trim().max(60).optional().nullable(),
})

/**
 * Send a Clerk invitation so a non-technical admin can onboard a new
 * teammate without ever touching the Clerk dashboard. The recipient
 * gets a branded email with a "Set up account" link; once they accept,
 * Clerk creates the user with the role baked in via publicMetadata.
 */
export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actingRole = (sessionClaims?.metadata as { role?: string })?.role
  if (!actingRole || !["ADMIN", "SUPER_ADMIN"].includes(actingRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, role, firstName, lastName } = parsed.data
  const trimmedEmail = email.trim().toLowerCase()

  try {
    const clerk = await clerkClient()

    // Build a sign-up redirect that lands the invitee inside the right
    // surface for their role. Admins land on the dashboard; everyone
    // else gets the portal default.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const redirectPath =
      role === "ADMIN" || role === "SUPER_ADMIN"
        ? "/admin/dashboard"
        : "/portal/dashboard"
    const redirectUrl = baseUrl ? `${baseUrl}${redirectPath}` : redirectPath

    const invitation = await clerk.invitations.createInvitation({
      emailAddress: trimmedEmail,
      redirectUrl,
      publicMetadata: { role },
      notify: true,
      ignoreExisting: false,
    })

    logger.info(
      `Team invite sent: ${trimmedEmail} (${role}) by ${userId}`,
      { action: "admin_invite_sent" }
    )

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email: trimmedEmail,
        role,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      },
    })
  } catch (err) {
    logger.error(`Team invite failed for ${trimmedEmail}`, err)
    const message = err instanceof Error ? err.message : "Failed to send invitation"
    // Clerk returns a 422 with a specific clerkError code when the
    // address is already in use — surface that cleanly so the UI can
    // show "they already have an account".
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
