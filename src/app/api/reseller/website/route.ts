import { NextResponse } from "next/server"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { getTemplate, TEMPLATES } from "@/lib/website/templates"
import { resolveSection } from "@/lib/website/registry"
import type { SectionType } from "@/lib/website/types"
import { buildAutofillOverrides } from "@/lib/website/autofill"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

/**
 * Combined whitelabel + Website-feature-entitlement check. Returns the
 * resolved dbUser when allowed, or a NextResponse to short-circuit the
 * caller when access is denied. The Website feature is a paid add-on
 * gated separately from the broader whitelabel role check, so an
 * operator with the RESELLER role but no Website entitlement (e.g.
 * Free tier or not yet upgraded) should not reach the editor APIs.
 */
async function authorizeWebsiteAccess(): Promise<
  | { ok: true; dbUser: NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>> }
  | { ok: false; response: NextResponse }
> {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: access.error },
        { status: access.status },
      ),
    }
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: access.clerkId },
  })
  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      ),
    }
  }

  // Admin / super-admin always pass — they're running the platform
  // and don't need to grant themselves entitlements to use their own
  // features. Mirrors the bypass already in the EntitlementGate server
  // component used by the page-level layout.
  if (dbUser.role === UserRole.ADMIN || dbUser.role === UserRole.SUPER_ADMIN) {
    return { ok: true, dbUser }
  }

  const allowed = await hasEntitlement(dbUser.id, FEATURE_ENTITLEMENTS.WEBSITE)
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Website feature is not unlocked on your plan." },
        { status: 402 },
      ),
    }
  }

  return { ok: true, dbUser }
}

export const dynamic = "force-dynamic"

// ─────────────────────────────────────────────────────────────────────
// GET — current website state for the editor
// ─────────────────────────────────────────────────────────────────────
export async function GET() {
  const auth = await authorizeWebsiteAccess()
  if (!auth.ok) return auth.response

  try {
    const operatorSite = await db.operatorSite.findUnique({
      where: { userId: auth.dbUser.id },
    })

    return NextResponse.json({
      activeTemplateId: operatorSite?.activeTemplateId ?? null,
      templateContent: operatorSite?.templateContent ?? {},
      websitePublishedAt:
        operatorSite?.websitePublishedAt?.toISOString() ?? null,
      isPublished: operatorSite?.isPublished ?? false,
      subdomain: operatorSite?.subdomain ?? null,
      customDomain: operatorSite?.customDomain ?? null,
      customDomainVerified: operatorSite?.customDomainVerified ?? false,
      templates: TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        bestFor: t.bestFor,
        thumbnailUrl: t.thumbnailUrl,
        mode: t.mode,
        sections: t.sections.map((s) => ({
          id: s.id,
          type: s.type,
          defaults: s.defaults,
        })),
      })),
    })
  } catch (err) {
    logger.error("Failed to load website state", err, {
      endpoint: "GET /api/reseller/website",
      userId: auth.dbUser.id,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────
// PATCH — save edits to the operator's site
// ─────────────────────────────────────────────────────────────────────
const patchSchema = z.object({
  activeTemplateId: z.string().min(1).max(60).optional(),
  /** Per-section overrides keyed by section instance id. */
  sectionContent: z
    .object({
      sectionId: z.string().min(1).max(60),
      sectionType: z.string().min(1).max(60),
      content: z.record(z.unknown()),
    })
    .optional(),
  publish: z.boolean().optional(),
  autofill: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const auth = await authorizeWebsiteAccess()
  if (!auth.ok) return auth.response

  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { id: auth.dbUser.id },
      include: { operatorSite: true },
    })
    if (!dbUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 })

    const site = dbUser.operatorSite
    if (!site)
      return NextResponse.json(
        {
          error:
            "No operator site yet — set your subdomain in /portal/settings/domain first.",
        },
        { status: 400 },
      )

    const update: Record<string, unknown> = {}
    let nextOverrides = (site.templateContent ?? {}) as Record<
      string,
      Record<string, unknown>
    >

    // Template change — validate the id maps to a known template.
    if (parsed.data.activeTemplateId) {
      const template = getTemplate(parsed.data.activeTemplateId)
      if (!template) {
        return NextResponse.json(
          { error: "Unknown template id" },
          { status: 400 },
        )
      }
      update.activeTemplateId = template.id
    }

    // Auto-fill from MemberProfile — runs synchronously and replaces the
    // existing override blob entirely so the operator gets a fresh start.
    if (parsed.data.autofill) {
      const overrides = await buildAutofillOverrides({ userId: dbUser.id })
      nextOverrides = overrides
      update.templateContent = overrides
    }

    // Section edit — validate against the section's schema BEFORE we
    // persist. Refuses to save anything that doesn't parse, so the
    // editor can never put bad content into the renderer.
    if (parsed.data.sectionContent) {
      const def = resolveSection(
        parsed.data.sectionContent.sectionType as SectionType,
      )
      if (!def) {
        return NextResponse.json(
          { error: "Unknown section type" },
          { status: 400 },
        )
      }
      const validated = def.schema.safeParse(
        parsed.data.sectionContent.content,
      )
      if (!validated.success) {
        return NextResponse.json(
          {
            error: "Section content failed validation",
            details: validated.error.flatten(),
          },
          { status: 400 },
        )
      }

      nextOverrides = {
        ...nextOverrides,
        [parsed.data.sectionContent.sectionId]: validated.data as Record<
          string,
          unknown
        >,
      }
      update.templateContent = nextOverrides
    }

    // Publish toggle — only publish if the operator already has at
    // least an active template (or we'll fall back to the default).
    if (parsed.data.publish !== undefined) {
      update.isPublished = parsed.data.publish
      if (parsed.data.publish) {
        update.websitePublishedAt = new Date()
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const updated = await db.operatorSite.update({
      where: { userId: dbUser.id },
      data: update,
      select: {
        activeTemplateId: true,
        templateContent: true,
        isPublished: true,
        websitePublishedAt: true,
      },
    })

    invalidateTenantCache({
      subdomains: [site.subdomain],
      customDomains: [site.customDomain],
    })

    // Return the updated state so the editor can avoid a second GET.
    // Eliminates the autofill silent-data-loss bug where a failed
    // refetch could blank the operator's overrides locally.
    return NextResponse.json({
      ok: true,
      activeTemplateId: updated.activeTemplateId,
      templateContent: updated.templateContent,
      isPublished: updated.isPublished,
      websitePublishedAt: updated.websitePublishedAt?.toISOString() ?? null,
    })
  } catch (err) {
    logger.error("Failed to save website", err, {
      endpoint: "PATCH /api/reseller/website",
      userId: auth.dbUser.id,
    })
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    )
  }
}
