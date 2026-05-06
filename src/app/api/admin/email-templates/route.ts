import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { EMAIL_TEMPLATES } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/email-templates
 *
 * Returns the full catalog of editable templates joined with any saved
 * overrides. The admin list view at /admin/email-templates renders
 * this — display name, description, phase, last-edited timestamp.
 */
export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const overrides = await db.emailTemplateOverride.findMany({
      select: { templateKey: true, updatedAt: true, updatedById: true },
    })
    const byKey = new Map(overrides.map((o) => [o.templateKey, o]))

    const items = EMAIL_TEMPLATES.map((t) => {
      const override = byKey.get(t.templateKey)
      return {
        templateKey: t.templateKey,
        displayName: t.displayName,
        description: t.description,
        phase: t.phase,
        hasOverride: !!override,
        updatedAt: override?.updatedAt?.toISOString() ?? null,
        updatedById: override?.updatedById ?? null,
      }
    })

    return NextResponse.json({ templates: items })
  } catch (err) {
    logger.error("Failed to list email templates", err, {
      endpoint: "GET /api/admin/email-templates",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
