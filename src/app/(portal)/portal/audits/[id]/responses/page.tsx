import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Inbox } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import type { QuizQuestion, AnswerMap } from "@/lib/audits/types"
import { ResponsesList, type AuditResponseDto } from "./ResponsesList"

export const dynamic = "force-dynamic"

const RESPONSE_PAGE_LIMIT = 100

async function loadQuizWithResponses(quizId: string, ownerId: string) {
  const quiz = await db.auditQuiz.findFirst({
    where: { id: quizId, ownerId, archivedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      questions: true,
    },
  })
  if (!quiz) return null

  const responses = await db.auditResponse.findMany({
    where: { quizId },
    orderBy: { createdAt: "desc" },
    take: RESPONSE_PAGE_LIMIT,
    select: {
      id: true,
      leadEmail: true,
      leadName: true,
      leadCompany: true,
      leadPhone: true,
      leadRole: true,
      answers: true,
      aiSummary: true,
      aiScore: true,
      aiTags: true,
      aiArms: true,
      aiGeneratedAt: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      completedAt: true,
      createdAt: true,
    },
  })

  return { quiz, responses }
}

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await ensureDbUser()
  const { id } = await params

  const data = await loadQuizWithResponses(id, user.id)
  if (!data) notFound()

  const questions = (Array.isArray(data.quiz.questions)
    ? (data.quiz.questions as unknown as QuizQuestion[])
    : []) as QuizQuestion[]

  const dtos: AuditResponseDto[] = data.responses.map((r) => ({
    id: r.id,
    leadEmail: r.leadEmail,
    leadName: r.leadName,
    leadCompany: r.leadCompany,
    leadPhone: r.leadPhone,
    leadRole: r.leadRole,
    answers: (r.answers ?? {}) as AnswerMap,
    aiSummary: r.aiSummary,
    aiScore: r.aiScore,
    aiTags: r.aiTags ?? [],
    aiGeneratedAt: r.aiGeneratedAt?.toISOString() ?? null,
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    utmCampaign: r.utmCampaign,
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/portal/audits/${data.quiz.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to editor
        </Link>
        <Link
          href={`/portal/audits/${data.quiz.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit audit
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          /q/{data.quiz.slug}
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {data.quiz.title} — responses
        </h1>
        <p className="text-xs text-muted-foreground">
          {dtos.length} {dtos.length === 1 ? "response" : "responses"}
          {dtos.length === RESPONSE_PAGE_LIMIT && " (most recent shown)"}
        </p>
      </div>

      {dtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card/40">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Inbox className="h-7 w-7 text-primary/60" />
          </div>
          <p className="text-foreground font-medium mb-1">No responses yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Share the audit link with prospects. As soon as they submit, their
            answers and AI summary will land here.
          </p>
        </div>
      ) : (
        <ResponsesList responses={dtos} questions={questions} />
      )}
    </div>
  )
}
