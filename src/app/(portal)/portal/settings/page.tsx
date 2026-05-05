import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { PortalSettingsClient } from "./SettingsClient"

export const metadata = { title: "Settings" }

export default async function PortalSettingsPage() {
  // Use ensureDbUser so a fresh tester whose Clerk webhook hasn't landed
  // yet still gets a User row instead of crashing the SettingsClient on
  // a null prop. Then re-select only the fields the client actually
  // needs (kept the select list explicit).
  const ensured = await ensureDbUser()
  const clerkUser = await currentUser()
  const dbUser = await db.user.findUnique({
    where: { id: ensured.id },
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
      notifNewPurchase: true,
      notifFulfillmentUpdate: true,
      notifSupportReply: true,
      notifBillingAlert: true,
      notifMarketingDigest: true,
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
