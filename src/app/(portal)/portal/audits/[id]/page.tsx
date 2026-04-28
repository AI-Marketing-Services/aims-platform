import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Inbox } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import type { QuizQuestion } from "@/lib/audits/types"
import { AuditEditor, type AuditQuizDto } from "./AuditEditor"

export const dynamic = "force-dynamic"

async function loadQuiz(quizId: string, ownerId: string) {
  return db.auditQuiz.findFirst({
    where: { id: quizId, ownerId, archivedAt: null },
    include: { _count: { select: { responses: true } } },
  })
}

export default async function AuditEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await ensureDbUser()
  const { id } = await params

  const quiz = await loadQuiz(id, user.id)
  if (!quiz) notFound()

  // questions is a `Prisma.JsonValue` — cast to our typed shape. The PATCH
  // route validates on every save, so values written through the editor are
  // guaranteed to round-trip through this shape.
  const questions = (Array.isArray(quiz.questions)
    ? (quiz.questions as unknown as QuizQuestion[])
    : []) as QuizQuestion[]

  const dto: AuditQuizDto = {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    subtitle: quiz.subtitle,
    ctaLabel: quiz.ctaLabel,
    logoUrl: quiz.logoUrl,
    brandColor: quiz.brandColor,
    accentColor: quiz.accentColor,
    customDomain: quiz.customDomain,
    successHeadline: quiz.successHeadline,
    successMessage: quiz.successMessage,
    successCta: quiz.successCta,
    successCtaUrl: quiz.successCtaUrl,
    collectEmail: quiz.collectEmail,
    emailRequired: quiz.emailRequired,
    isPublished: quiz.isPublished,
    questions,
    responseCount: quiz._count.responses,
    updatedAt: quiz.updatedAt.toISOString(),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/portal/audits"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to audits
        </Link>
        <Link
          href={`/portal/audits/${quiz.id}/responses`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border"
        >
          <Inbox className="h-3.5 w-3.5" />
          {quiz._count.responses} {quiz._count.responses === 1 ? "response" : "responses"}
        </Link>
      </div>

      <AuditEditor quiz={dto} />
    </div>
  )
}
