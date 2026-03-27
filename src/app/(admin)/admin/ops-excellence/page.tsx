import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { EngagementPipeline } from "@/components/ops-excellence/admin/EngagementPipeline"
import { getEngagementList } from "@/lib/ops-excellence/queries"

export default async function AdminOpsExcellencePage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/sign-in")

  const engagements = await getEngagementList()

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Operational Excellence" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Operational Excellence
        </h1>
        <p className="text-muted-foreground">
          Client engagement pipeline
        </p>
      </div>
      <EngagementPipeline engagements={engagements} />
    </div>
  )
}
