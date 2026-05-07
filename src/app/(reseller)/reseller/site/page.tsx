import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { TEMPLATES } from "@/lib/website/templates"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"
import { WebsiteEditor } from "@/components/website/editor/website-editor"

export const metadata = { title: "Website" }
export const dynamic = "force-dynamic"

/**
 * Operator-facing Website editor. Hydrates with the operator's current
 * site state + the full template manifest, then runs as a client app.
 * All edits flow through PATCH /api/reseller/website with server-side
 * Zod validation per section type — the editor's job is just UX.
 */
export default async function WebsiteEditorPage() {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    redirect("/portal/dashboard")
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: access.clerkId },
    include: {
      operatorSite: true,
      memberProfile: {
        select: {
          businessName: true,
          oneLiner: true,
          tagline: true,
          niche: true,
          idealClient: true,
          businessUrl: true,
          logoUrl: true,
          brandColor: true,
          accentColor: true,
          fontHeading: true,
        },
      },
    },
  })

  if (!dbUser) redirect("/portal/dashboard")

  return (
    <WebsiteEditor
      site={
        dbUser.operatorSite
          ? {
              activeTemplateId: dbUser.operatorSite.activeTemplateId ?? null,
              templateContent:
                (dbUser.operatorSite.templateContent ?? {}) as Record<
                  string,
                  Record<string, unknown>
                >,
              isPublished: dbUser.operatorSite.isPublished,
              subdomain: dbUser.operatorSite.subdomain,
              customDomain: dbUser.operatorSite.customDomain,
              customDomainVerified: dbUser.operatorSite.customDomainVerified,
              websitePublishedAt:
                dbUser.operatorSite.websitePublishedAt?.toISOString() ?? null,
            }
          : null
      }
      profile={dbUser.memberProfile}
      templates={TEMPLATES.map((t) => ({
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
      }))}
    />
  )
}
