import { requireTenantByCustomDomain } from "@/lib/tenant/resolve-tenant"
import { WebsiteRenderer } from "@/components/website/website-renderer"

type Props = {
  params: Promise<{ hostname: string }>
}

export default async function DomainSitePage({ params }: Props) {
  const { hostname } = await params
  const tenant = await requireTenantByCustomDomain(hostname)
  return <WebsiteRenderer tenant={tenant} />
}
