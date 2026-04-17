import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

/**
 * TEMPORARY debug endpoint — returns the current session's raw claims plus
 * the user's publicMetadata straight from the Clerk backend API. Used to
 * diagnose why role resolution isn't giving access to /admin.
 *
 * Safe to hit while signed in; doesn't expose another user's data.
 */
export async function GET() {
  const { userId, sessionClaims, sessionId } = await auth()

  if (!userId) {
    return NextResponse.json({ signedIn: false }, { status: 401 })
  }

  let clerkUser: {
    id: string
    publicMetadata: unknown
    privateMetadata: unknown
    primaryEmail?: string
  } | null = null
  let clerkError: string | null = null
  try {
    const user = await (await clerkClient()).users.getUser(userId)
    clerkUser = {
      id: user.id,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      primaryEmail: user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress,
    }
  } catch (err) {
    clerkError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(
    {
      signedIn: true,
      userId,
      sessionId,
      sessionClaims,
      sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : null,
      metadataOnClaim: (sessionClaims as { metadata?: unknown })?.metadata ?? null,
      publicMetadataOnClaim: (sessionClaims as { publicMetadata?: unknown })?.publicMetadata ?? null,
      clerkUser,
      clerkError,
      resolvedRole:
        (sessionClaims as { metadata?: { role?: string } })?.metadata?.role ??
        (sessionClaims as { publicMetadata?: { role?: string } })?.publicMetadata?.role ??
        (clerkUser?.publicMetadata as { role?: string })?.role ??
        "CLIENT (default)",
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
