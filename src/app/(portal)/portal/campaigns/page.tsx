import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CampaignsDashboardClient } from "./CampaignsDashboardClient"

export const metadata = { title: "Campaigns" }

export default async function CampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return <CampaignsDashboardClient />
}
