import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { EmailCampaignsClient } from "./EmailCampaignsClient"

export const metadata = { title: "Email Campaigns" }

export default async function AdminEmailCampaignsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      emailBisonConnection: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Campaigns</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Connect clients to their Email Bison workspaces. Stats appear on their portal dashboard.
        </p>
      </div>
      <EmailCampaignsClient users={users} />
    </div>
  )
}
