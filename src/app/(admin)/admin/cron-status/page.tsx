import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CronStatusClient } from "./CronStatusClient"

export const metadata = { title: "Job Health | AIMS Admin" }

export default async function CronStatusPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  return <CronStatusClient />
}
