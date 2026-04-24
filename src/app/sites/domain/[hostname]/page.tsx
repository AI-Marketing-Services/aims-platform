import { requireTenantByCustomDomain } from '@/lib/tenant/resolve-tenant'
import { TenantLanding } from '@/components/tenant/tenant-landing'

type Props = {
  params: Promise<{ hostname: string }>
}

export default async function DomainSitePage({ params }: Props) {
  const { hostname } = await params
  const tenant = await requireTenantByCustomDomain(hostname)

  return <TenantLanding tenant={tenant} />
}
