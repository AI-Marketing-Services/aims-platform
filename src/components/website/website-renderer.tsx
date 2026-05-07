import type { TenantContext } from "@/components/providers/tenant-theme-provider"
import { resolveSection } from "@/lib/website/registry"
import {
  buildSectionBrand,
  resolveActiveTemplate,
  resolveSectionContent,
} from "@/lib/website/render"

interface Props {
  tenant: TenantContext
}

/**
 * Renders an operator's whitelabel website by walking their active
 * template's section list, validating per-section content against the
 * registry schemas, and emitting each section's component.
 *
 * Server Component — runs on the edge of every tenant page request.
 * Each section's render is itself usually an RSC; only sections with
 * interactive UI (FAQ accordion, CTA form) are "use client".
 */
export function WebsiteRenderer({ tenant }: Props) {
  const template = resolveActiveTemplate(
    (tenant.operatorSite as { activeTemplateId?: string | null })
      .activeTemplateId ?? null,
  )
  const brand = buildSectionBrand(tenant)
  const overrides =
    (tenant.operatorSite as { templateContent?: unknown }).templateContent ?? {}

  return (
    <main className={template.mode === "dark" ? "bg-neutral-950" : "bg-white"}>
      {template.sections.map((section) => {
        const def = resolveSection(section.type)
        const content = resolveSectionContent(
          section.id,
          section.type,
          section.defaults,
          overrides,
        )
        const SectionComponent = def.Component
        return (
          <SectionComponent
            key={section.id}
            content={content}
            brand={brand}
          />
        )
      })}
    </main>
  )
}
