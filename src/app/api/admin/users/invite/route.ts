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

    // Case A: a Clerk user already exists for this email. Clerk's
    // createInvitation will 422 in that case, and the user never sees
    // why. Handle it directly: just set/update their role. Saves the
    // admin an extra support ticket.
    const existing = await clerk.users.getUserList({
      emailAddress: [trimmedEmail],
    })
    if (existing.data.length > 0) {
      const user = existing.data[0]
      const prevMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>
      await clerk.users.updateUserMetadata(user.id, {
        publicMetadata: { ...prevMetadata, role },
      })
      logger.info(
        `Existing Clerk user role updated: ${trimmedEmail} -> ${role} by ${userId}`,
        { action: "admin_invite_existing_user_role_updated" }
      )
      return NextResponse.json({
        ok: true,
        updated: true,
        message: `${trimmedEmail} already has an account — role set to ${role}. They already have access.`,
        user: { id: user.id, email: trimmedEmail, role },
      })
    }

    // Case B: a prior invitation is still pending. Revoke it so we can
    // reissue (e.g., if the role was wrong, or the invite was never
    // opened). Clerk rejects duplicates otherwise.
    const pending = await clerk.invitations.getInvitationList({
      status: "pending",
    })
    for (const inv of pending.data) {
      if (inv.emailAddress.toLowerCase() === trimmedEmail) {
        await clerk.invitations.revokeInvitation(inv.id)
      }
    }

    // Build an ABSOLUTE sign-up redirect URL. Clerk rejects relative
    // paths with "redirect_url must be a valid url". We derive the
    // origin from the incoming request so this works regardless of
    // whether NEXT_PUBLIC_APP_URL is configured in the runtime env.
    // Always redirect to /sign-up so Clerk appends __clerk_ticket to that
    // URL. Our sign-up page detects the ticket and renders the SignUp
    // component. Sending to /admin/dashboard (or /portal/dashboard) fails
    // because middleware bounces the unauthenticated user to /sign-in and
    // the ticket is lost in the redirect chain.
    const redirectPath = "/sign-up"
    const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim()
    const origin =
      envBase && /^https?:\/\//i.test(envBase)
        ? envBase.replace(/\/$/, "")
        : new URL(req.url).origin
    const redirectUrl = `${origin}${redirectPath}`

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

    // Clerk errors throw with an `errors` array of { code, message,
    // longMessage }. Unwrap that so the admin sees the real reason
    // (e.g. "duplicate_record", "form_identifier_not_allowed_access"),
    // not the useless "Unprocessable Entity" HTTP label.
    let clerkCode: string | null = null
    let clerkMessage: string | null = null
    if (err && typeof err === "object" && "errors" in err) {
      const errors = (err as {
        errors?: Array<{ code?: string; message?: string; longMessage?: string }>
      }).errors
      if (Array.isArray(errors) && errors.length > 0) {
        clerkCode = errors[0].code ?? null
        clerkMessage = errors[0].longMessage ?? errors[0].message ?? null
      }
    }

    const raw = err instanceof Error ? err.message : "Failed to send invitation"
    const message = clerkMessage ?? raw
    return NextResponse.json(
      { error: message, code: clerkCode, email: trimmedEmail },
      { status: 400 }
    )
  }
}
