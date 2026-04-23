import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CampaignsDashboardClient } from "./CampaignsDashboardClient"

export const metadata = { title: "Campaigns" }

export default async function CampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const clerkUser = await currentUser()
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ""
  if (userEmail !== "adamwolfe100@gmail.com") {
    redirect("/portal/dashboard")
  }

  return <CampaignsDashboardClient />
}
