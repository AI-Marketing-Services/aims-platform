import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { UsersTable } from "./UsersTable"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Team Access" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Team Access</h1>
        <p className="text-muted-foreground">
          Promote teammates to ADMIN so they can reach the CRM. Self-signup is
          disabled — create the account in the Clerk dashboard first, then
          flip them to ADMIN here.
        </p>
      </div>
      <UsersTable currentUserId={userId} />
    </div>
  )
}
