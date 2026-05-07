import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import sanitizeHtml from "sanitize-html"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getTemplateEntry } from "@/lib/email/catalog"

export const dynamic = "force-dynamic"

const upsertSchema = z.object({
  // Subject is plain text — strip control chars + CRLF to prevent header injection
  // and keep it on one line. Length cap is generous; Gmail truncates ~75 anyway.
  // Validate AFTER the transform so a string of only whitespace/control chars
  // (e.g. "\r\n\t") doesn't pass .min(1) only to land in the DB as empty.
  subject: z
    .string()
    .transform((s) => s.replace(/[\r\n\t]+/g, " ").trim())
    .pipe(z.string().min(1).max(300)),
  html: z.string().min(1).max(200_000),
  note: z.string().max(500).optional(),
})

/**
 * Sanitize the HTML the admin saves. Allows the rich set of tags + inline
 * styles email clients tolerate, but strips:
 *   - <script> + every event-handler attribute (onerror=, onload=, etc.)
 *   - javascript:/data: URLs in href/src
 *   - <iframe>, <object>, <embed>
 * This stops a compromised admin (or rogue staff) from saving an override
 * that smuggles malicious markup into outgoing customer mail. Email clients
 * mostly strip <script> already but mobile webviews and Outlook are
 * inconsistent, and the Send Test path renders to a real inbox.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "html", "head", "body", "meta", "title",
    "p", "br", "hr", "div", "span",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s",
    "a", "img",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th",
    "blockquote", "pre", "code",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "style"],
    img: ["src", "alt", "title", "width", "height", "style"],
    table: ["border", "cellpadding", "cellspacing", "width", "style"],
    td: ["colspan", "rowspan", "width", "align", "valign", "style"],
    th: ["colspan", "rowspan", "width", "align", "valign", "style"],
    tr: ["style", "valign"],
    div: ["style", "align"],
    span: ["style"],
    p: ["style", "align"],
    h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
    ul: ["style"], ol: ["style"], li: ["style"],
    "*": [],
  },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https", "data"] }, // data: only for inline image attachments
  allowProtocolRelative: false,
  // Drop unrecognized tags entirely rather than leaking their text content.
  disallowedTagsMode: "discard",
}

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

  // Sanitize HTML server-side BEFORE write. Never trust the editor — admin
  // could paste from a compromised source, an attacker with a stolen session
  // could craft a phishing template, etc. This is the canonical sink.
  const cleanHtml = sanitizeHtml(parsed.data.html, SANITIZE_OPTIONS)
  if (!cleanHtml.trim()) {
    return NextResponse.json(
      { error: "HTML body is empty after sanitization — paste content with allowed tags." },
      { status: 400 },
    )
  }

  try {
    const saved = await db.emailTemplateOverride.upsert({
      where: { templateKey: key },
      create: {
        templateKey: key,
        subject: parsed.data.subject,
        html: cleanHtml,
        note: parsed.data.note ?? null,
        updatedById: auth.userId,
      },
      update: {
        subject: parsed.data.subject,
        html: cleanHtml,
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
