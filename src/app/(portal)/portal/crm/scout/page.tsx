import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LeadScout } from "@/components/portal/crm/LeadScout"

export const dynamic = "force-dynamic"

export default async function LeadScoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden -m-4 lg:-m-6 xl:-m-8">
      <LeadScout />
    </div>
  )
}
