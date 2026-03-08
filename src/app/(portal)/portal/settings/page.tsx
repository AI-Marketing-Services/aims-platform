import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PortalSettingsClient } from "./SettingsClient"

export const metadata = { title: "Settings" }

export default async function PortalSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const clerkUser = await currentUser()
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      phone: true,
      website: true,
      industry: true,
      locationCount: true,
      emailNotifs: true,
      slackNotifs: true,
    },
  })

  return (
    <PortalSettingsClient
      clerkUser={{
        firstName: clerkUser?.firstName ?? "",
        lastName: clerkUser?.lastName ?? "",
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: clerkUser?.imageUrl ?? "",
      }}
      dbUser={dbUser}
    />
  )
}
