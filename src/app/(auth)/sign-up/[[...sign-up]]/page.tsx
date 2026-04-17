import { redirect } from "next/navigation"

// The AI Operator Collective doesn't support user self-signup. The only
// way in is the /apply funnel + a human-approved invite by the admin
// team, at which point we provision the Mighty Networks member directly
// (see /api/admin/deals/:id/invite-to-mighty).
//
// Admins who need a Clerk account are created by another admin in the
// Clerk dashboard, not through this page.
//
// We preserve the `ref` / `dub_id` query params so referral attribution
// still tracks when someone lands here from a partner link.
export default async function SignUpRedirect({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; dub_id?: string; [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const qs = new URLSearchParams()
  if (typeof params.dub_id === "string") qs.set("dub_id", params.dub_id)
  if (typeof params.ref === "string") qs.set("ref", params.ref)
  const query = qs.toString()
  redirect(query ? `/apply?${query}` : "/apply")
}
