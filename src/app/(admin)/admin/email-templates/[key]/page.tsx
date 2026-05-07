import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { getTemplateEntry, EMAIL_TEMPLATES } from "@/lib/email/catalog"
import { withDryRun } from "@/lib/email/dry-run"
import { logger } from "@/lib/logger"
import { TemplateEditorClient } from "./TemplateEditorClient"

export const dynamic = "force-dynamic"

export default async function EmailTemplateEditorPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  const { key: rawKey } = await params
  const key = decodeURIComponent(rawKey)
  const entry = getTemplateEntry(key)
  if (!entry) notFound()

  // Resolve a sample recipient that won't ever leak in the rendered
  // preview (we use the admin's own Clerk email if present, else a
  // safe placeholder). The string only flows into the sample()
  // factory, so it appears in the rendered HTML where the template
  // would normally show "to" the recipient.
  const me = await currentUser()
  const sampleRecipient =
    me?.emailAddresses?.[0]?.emailAddress ?? "preview@aimseos.com"

  // Render the pristine code default by running the catalog send
  // wrapper inside a dry-run scope. `skipOverride: true` means the
  // editor always shows what the codebase ships, even if a saved
  // override exists — the override flows through the editable
  // subject/html state instead.
  let defaultSubject = ""
  let defaultHtml = ""
  try {
    const { captured } = await withDryRun(
      () => entry.send(entry.sample(sampleRecipient)),
      { skipOverride: true },
    )
    const first = captured[0]
    defaultSubject = first?.subject ?? ""
    defaultHtml = first?.html ?? ""
  } catch (err) {
    logger.error("Failed to render template default for editor", err, {
      templateKey: key,
    })
    // Editor will fall back to placeholders; admin can still type
    // from scratch.
  }

  const override = await db.emailTemplateOverride.findUnique({
    where: { templateKey: key },
  })

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Email Templates", href: "/admin/email-templates" },
          { label: entry.displayName },
        ]}
      />

      <Link
        href="/admin/email-templates"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        All templates
      </Link>

      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-2">
          {entry.templateKey}
        </p>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {entry.displayName}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {entry.description}
        </p>
      </div>

      <TemplateEditorClient
        templateKey={entry.templateKey}
        displayName={entry.displayName}
        defaultSubject={defaultSubject}
        defaultHtml={defaultHtml}
        override={
          override
            ? {
                subject: override.subject,
                html: override.html,
                note: override.note,
                updatedAt: override.updatedAt.toISOString(),
              }
            : null
        }
      />

      <p className="text-[11px] text-muted-foreground">
        Tip: there are {EMAIL_TEMPLATES.length} templates total. Use the
        sidebar to navigate back to the full list.
      </p>
    </div>
  )
}
