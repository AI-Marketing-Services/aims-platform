import type { Metadata } from "next"
import { notFound } from "next/navigation"

import QuizClient from "@/app/q/[slug]/QuizClient"
import { resolveQuizBranding } from "@/lib/audits/branding"
import type { QuizQuestion } from "@/lib/audits/types"
import { db } from "@/lib/db"
import { resolveTenantBySubdomain } from "@/lib/tenant/resolve-tenant"

// Subdomain quiz route. The middleware rewrites
// `acme.aioperatorcollective.com/q/foo` → `/sites/acme/q/foo`. Like the
// custom-domain page, this only resolves quizzes whose owner matches the
// subdomain's operator.
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string; quizSlug: string }>
}

async function loadOwnedQuiz(slug: string, ownerId: string) {
  return db.auditQuiz.findFirst({
    where: { slug, ownerId, isPublished: true, archivedAt: null },
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
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, quizSlug } = await params
  const tenant = await resolveTenantBySubdomain(slug)
  if (!tenant) return { robots: { index: false, follow: false } }

  const quiz = await db.auditQuiz.findFirst({
    where: {
      slug: quizSlug,
      ownerId: tenant.reseller.id,
      isPublished: true,
      archivedAt: null,
    },
    select: { title: true, subtitle: true },
  })
  if (!quiz) return { title: "Audit", robots: { index: false, follow: false } }

  return {
    title: quiz.title,
    description: quiz.subtitle ?? undefined,
    robots: { index: false, follow: false },
  }
}

export default async function SubdomainQuizPage({ params }: PageProps) {
  const { slug, quizSlug } = await params

  const tenant = await resolveTenantBySubdomain(slug)
  if (!tenant) notFound()

  const quiz = await loadOwnedQuiz(quizSlug, tenant.reseller.id)
  if (!quiz) notFound()

  const branding = await resolveQuizBranding({
    ownerId: quiz.ownerId,
    quiz: {
      logoUrl: quiz.logoUrl,
      brandColor: quiz.brandColor,
      accentColor: quiz.accentColor,
    },
  })

  const questions = (quiz.questions as unknown as QuizQuestion[]) ?? []

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
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
    </div>
  )
}
