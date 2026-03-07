import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CRMKanban } from "./CRMKanban"

export default async function AdminCRMPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-1">CRM Pipeline</h1>
        <p className="text-gray-400">Drag deals between stages to update pipeline</p>
      </div>
      <CRMKanban />
    </div>
  )
}
