import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { getTemplateEntry, EMAIL_TEMPLATES } from "@/lib/email/catalog"
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

  const override = await db.emailTemplateOverride.findUnique({
    where: { templateKey: key },
  })

  // Compute the default subject + html by calling the matching send
  // function in "preview mode" — but we can't actually send during
  // page render. Instead the client component re-renders the default
  // by hitting a dedicated `?preview=1` flag (or just shows the saved
  // override if one exists; new edits start from a blank if no
  // override exists).
  //
  // Pragmatic approach: pass the override (if any) and an empty
  // string for the default. The client knows to show "Edit override"
  // when a row exists, "Create override" when none. The "Send test"
  // button always renders the production default (with override
  // applied) regardless.

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
