import { CampaignsDashboardClient } from "./CampaignsDashboardClient"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export const metadata = { title: "Campaigns" }

export default async function CampaignsPage() {
  await ensureDbUser()
  return <CampaignsDashboardClient />
}
