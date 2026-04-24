import { requireTenantBySubdomain } from '@/lib/tenant/resolve-tenant'
import { TenantLanding } from '@/components/tenant/tenant-landing'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function SlugSitePage({ params }: Props) {
  const { slug } = await params
  const tenant = await requireTenantBySubdomain(slug)

  return <TenantLanding tenant={tenant} />
}
