import { ClipboardCheck, FileText } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { AuditsListClient } from "./AuditsListClient"
import { NewAuditButton } from "./NewAuditButton"

export const dynamic = "force-dynamic"

interface AuditQuizListItem {
  id: string
  slug: string
  title: string
  subtitle: string | null
  isPublished: boolean
  brandColor: string | null
  customDomain: string | null
  createdAt: string
  updatedAt: string
  responseCount: number
  lastResponseAt: string | null
}

async function loadQuizzes(ownerId: string): Promise<AuditQuizListItem[]> {
  let rows
  try {
    rows = await db.auditQuiz.findMany({
      where: { ownerId, archivedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        isPublished: true,
        brandColor: true,
        customDomain: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { responses: true } },
        responses: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })
  } catch (err) {
    logger.error("loadQuizzes failed", err, {
      endpoint: "/portal/audits",
      ownerId,
    })
    throw err
  }

  return rows.map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    subtitle: q.subtitle,
    isPublished: q.isPublished,
    brandColor: q.brandColor,
    customDomain: q.customDomain,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    responseCount: q._count.responses,
    lastResponseAt: q.responses[0]?.createdAt?.toISOString() ?? null,
  }))
}

export default async function AuditsPage() {
  const user = await ensureDbUser()
  const quizzes = await loadQuizzes(user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Audits</h1>
            <p className="text-xs text-muted-foreground">
              Branded intake quizzes — share the link, capture leads, review AI summaries.
            </p>
          </div>
        </div>
        <NewAuditButton />
      </div>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card/40">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-primary/60" />
          </div>
          <p className="text-foreground font-medium mb-1">No audits yet</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Create your first audit from the 9-question AI Audit template. Customize
            branding, copy the share link, and start collecting leads in minutes.
          </p>
          <NewAuditButton label="Create your first audit" />
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tip: edit questions, branding, and the success page after it&apos;s created.
          </p>
        </div>
      ) : (
        <AuditsListClient quizzes={quizzes} />
      )}
    </div>
  )
}
