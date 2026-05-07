import { notFound } from "next/navigation"
import { getLeadMagnet } from "@/lib/tenant/lead-magnet-registry"
import { TenantToolRenderer } from "@/components/portal/lead-magnets/TenantToolRenderer"

interface Props {
  params: Promise<{ hostname: string; tool: string }>
}

/**
 * Tenant-aware tool route for operators on a verified custom domain.
 * Mirrors `/sites/[slug]/tools/[tool]` but resolved through the
 * `/sites/domain/[hostname]/layout.tsx` layout (which loads the tenant
 * by customDomain).
 */
export default async function TenantCustomDomainToolPage({ params }: Props) {
  const { tool } = await params
  const def = getLeadMagnet(tool)
  if (!def) notFound()

  return <TenantToolRenderer slug={tool} />
}

export async function generateMetadata({ params }: Props) {
  const { tool } = await params
  const def = getLeadMagnet(tool)
  if (!def) return {}
  return { title: def.name, description: def.tagline }
}
