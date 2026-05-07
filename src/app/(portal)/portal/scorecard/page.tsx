import { ensureDbUser } from "@/lib/auth/ensure-user"
import { ScorecardClient } from "@/components/portal/scorecard/ScorecardClient"

export const metadata = { title: "Scorecard" }
export const dynamic = "force-dynamic"

/**
 * Weekly Prospecting Activity Scorecard. Server component is intentionally
 * thin — auth-walls the route, then hands off to the client which fetches
 * data through /api/portal/scorecard. Rendering on the client keeps the
 * timezone math honest (Monday in the operator's local clock, not the
 * server's) without complicating SSR.
 */
export default async function ScorecardPage() {
  await ensureDbUser()
  return <ScorecardClient />
}
