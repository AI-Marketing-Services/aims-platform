import { notFound } from "next/navigation"
import { getLeadMagnet } from "@/lib/tenant/lead-magnet-registry"
import { TenantToolRenderer } from "@/components/portal/lead-magnets/TenantToolRenderer"

interface Props {
  params: Promise<{ slug: string; tool: string }>
}

/**
 * Tenant-aware lead-magnet route. The platform middleware rewrites
 * `acme.aioperatorcollective.com/tools/website-audit` into
 * `/sites/acme/tools/website-audit`, which lands here.
 *
 * The parent layout (`/sites/[slug]/layout.tsx`) already wraps this
 * subtree in a `TenantThemeProvider` so the underlying tool client
 * picks up branding via CSS custom properties. We render the SAME
 * client component used at `/tools/<slug>` on the platform — it just
 * inherits the operator's brand colors.
 *
 * Lead attribution happens server-side at submit time: the API reads
 * `x-forwarded-host` to identify the operator and attaches operatorId
 * + creates the Deal under the operator's userId. Zero client changes
 * required for the existing tool components.
 */
export default async function TenantToolPage({ params }: Props) {
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
