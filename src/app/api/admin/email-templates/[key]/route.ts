import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getTemplateEntry } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"

const upsertSchema = z.object({
  subject: z.string().min(1).max(300),
  html: z.string().min(1).max(200_000),
  note: z.string().max(500).optional(),
})

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: "Unauthorized" as const, status: 401 as const }
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return { error: "Forbidden" as const, status: 403 as const }
  }
  return { userId }
}

/**
 * GET /api/admin/email-templates/[key]
 *
 * Returns the catalog entry + any saved override + a default-rendered
 * preview (subject + html) using the entry's `sample` factory. The
 * admin detail page renders the override side-by-side with the
 * default so the editor can see exactly what they're changing.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { key } = await params
  const entry = getTemplateEntry(key)
  if (!entry) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 404 })
  }

  const override = await db.emailTemplateOverride.findUnique({
    where: { templateKey: key },
  })

  return NextResponse.json({
    templateKey: entry.templateKey,
    displayName: entry.displayName,
    description: entry.description,
    phase: entry.phase,
    override: override
      ? {
          subject: override.subject,
          html: override.html,
          note: override.note,
          updatedAt: override.updatedAt.toISOString(),
          updatedById: override.updatedById,
        }
      : null,
  })
}

/**
 * PUT /api/admin/email-templates/[key]
 *
 * Upserts an override. Body: { subject, html, note? }. Saves are
 * idempotent — re-saving the same body just bumps updatedAt.
 *
 * To revert to the code default, DELETE this resource (separate route).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { key } = await params
  const entry = getTemplateEntry(key)
  if (!entry) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const saved = await db.emailTemplateOverride.upsert({
      where: { templateKey: key },
      create: {
        templateKey: key,
        subject: parsed.data.subject,
        html: parsed.data.html,
        note: parsed.data.note ?? null,
        updatedById: auth.userId,
      },
      update: {
        subject: parsed.data.subject,
        html: parsed.data.html,
        note: parsed.data.note ?? null,
        updatedById: auth.userId,
      },
    })
    logger.info(`Email template override saved`, {
      templateKey: key,
      updatedById: auth.userId,
    })
    return NextResponse.json({
      ok: true,
      override: {
        subject: saved.subject,
        html: saved.html,
        updatedAt: saved.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    logger.error("Failed to save email template override", err, {
      templateKey: key,
    })
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }
}

/** DELETE /api/admin/email-templates/[key] — revert to code default. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { key } = await params
  await db.emailTemplateOverride
    .delete({ where: { templateKey: key } })
    .catch(() => {
      // Already absent — fine. Idempotent revert.
    })
  return NextResponse.json({ ok: true })
}
