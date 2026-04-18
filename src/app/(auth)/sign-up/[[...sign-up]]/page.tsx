import { redirect } from "next/navigation"
import { SignUp } from "@clerk/nextjs"
import { Suspense } from "react"

// The AI Operator Collective doesn't do user self-signup. The only way
// into the community is the /apply funnel + a human-approved invite
// by the admin team, at which point we provision the Mighty Networks
// member directly (see /api/admin/deals/:id/invite-to-mighty).
//
// EXCEPTION — admin invitations:
// When an admin invites a teammate from the Clerk dashboard (Users ->
// Invite), Clerk emails them a link like
// /sign-up?__clerk_ticket=<ticket>&__clerk_status=sign_up. If that
// ticket param is present we must render the actual SignUp component,
// otherwise the teammate can't set their password + finish account
// creation. Without the ticket, we redirect casual visitors to /apply.
//
// Preserves ref / dub_id query params so referral attribution survives
// the redirect.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    __clerk_ticket?: string
    __clerk_status?: string
    ref?: string
    dub_id?: string
    [key: string]: string | string[] | undefined
  }>
}) {
  const params = await searchParams

  // Clerk-invited admin. Render the real SignUp UI so they can finish
  // account creation with the ticket. Clerk handles the rest. Explicit
  // `path` + redirect props mirror the sign-in page so Clerk routes
  // its internal sub-pages (OTP, factor) under /sign-up/* without
  // blanking.
  if (typeof params.__clerk_ticket === "string" && params.__clerk_ticket.length > 0) {
    return (
      <Suspense fallback={null}>
        <SignUp
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/admin/dashboard"
        />
      </Suspense>
    )
  }

  // Not invited — send them through the application funnel.
  const qs = new URLSearchParams()
  if (typeof params.dub_id === "string") qs.set("dub_id", params.dub_id)
  if (typeof params.ref === "string") qs.set("ref", params.ref)
  const query = qs.toString()
  redirect(query ? `/apply?${query}` : "/apply")
}
