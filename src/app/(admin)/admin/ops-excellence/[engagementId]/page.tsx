import { redirect, notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { EngagementDetail } from "@/components/ops-excellence/admin/EngagementDetail"
import { db } from "@/lib/db"

export default async function AdminEngagementDetailPage({
  params,
}: {
  params: Promise<{ engagementId: string }>
}) {
  const { engagementId } = await params
  const adminId = await requireAdmin()
  if (!adminId) redirect("/sign-in")

  const engagement = await db.opsExcellenceEngagement.findUnique({
    where: { id: engagementId },
    select: { companyName: true },
  })
  if (!engagement) notFound()

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Ops Excellence", href: "/admin/ops-excellence" },
          { label: engagement.companyName },
        ]}
      />
      <EngagementDetail engagementId={engagementId} />
    </div>
  )
}
