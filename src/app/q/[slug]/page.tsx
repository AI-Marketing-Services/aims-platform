import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { resolveQuizBranding } from "@/lib/audits/branding"
import type { QuizQuestion } from "@/lib/audits/types"

import QuizClient from "./QuizClient"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadQuiz(slug: string) {
  const quiz = await db.auditQuiz.findFirst({
    where: { slug, isPublished: true, archivedAt: null },
    select: {
      id: true,
      ownerId: true,
      slug: true,
      title: true,
      subtitle: true,
      ctaLabel: true,
      logoUrl: true,
      brandColor: true,
      accentColor: true,
      questions: true,
      successHeadline: true,
      successMessage: true,
      successCta: true,
      successCtaUrl: true,
      collectEmail: true,
      emailRequired: true,
    },
  })
  return quiz
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const quiz = await db.auditQuiz.findFirst({
    where: { slug, isPublished: true, archivedAt: null },
    select: { title: true, subtitle: true },
  })
  if (!quiz) {
    return {
      title: "Audit",
      robots: { index: false, follow: false },
    }
  }
  return {
    title: quiz.title,
    description: quiz.subtitle ?? undefined,
    robots: { index: false, follow: false },
  }
}

export default async function PublicQuizPage({ params }: PageProps) {
  const { slug } = await params
  const quiz = await loadQuiz(slug)

  if (!quiz) {
    notFound()
  }

  const branding = await resolveQuizBranding({
    ownerId: quiz.ownerId,
    quiz: {
      logoUrl: quiz.logoUrl,
      brandColor: quiz.brandColor,
      accentColor: quiz.accentColor,
    },
  })

  // Questions are stored as JSON; cast to typed shape for the client.
  const questions = (quiz.questions as unknown as QuizQuestion[]) ?? []

  return (
    <QuizClient
      slug={quiz.slug}
      title={quiz.title}
      subtitle={quiz.subtitle}
      ctaLabel={quiz.ctaLabel}
      questions={questions}
      collectEmail={quiz.collectEmail}
      emailRequired={quiz.emailRequired}
      success={{
        headline: quiz.successHeadline,
        message: quiz.successMessage,
        cta: quiz.successCta,
        ctaUrl: quiz.successCtaUrl,
      }}
      branding={{
        logoUrl: branding.logoUrl,
        brandColor: branding.brandColor,
        accentColor: branding.accentColor,
        ownerName: branding.ownerName,
        ownerCompany: branding.ownerCompany,
      }}
    />
  )
}
