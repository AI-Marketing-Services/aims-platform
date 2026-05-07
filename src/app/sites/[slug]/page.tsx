import { requireTenantBySubdomain } from "@/lib/tenant/resolve-tenant"
import { WebsiteRenderer } from "@/components/website/website-renderer"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function SlugSitePage({ params }: Props) {
  const { slug } = await params
  const tenant = await requireTenantBySubdomain(slug)
  return <WebsiteRenderer tenant={tenant} />
}
