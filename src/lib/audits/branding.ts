import { db } from "@/lib/db"

const DEFAULT_BRAND_COLOR = "#C4972A"

interface ResolvedBranding {
  logoUrl: string | null
  brandColor: string
  accentColor: string | null
  ownerName: string | null
  ownerCompany: string | null
}

// Resolve quiz branding by falling back through:
//   AuditQuiz overrides → owner.memberProfile → AOC defaults.
// Used by the public quiz page so operators can override per-quiz without
// stomping their account-wide brand.
export async function resolveQuizBranding(params: {
  ownerId: string
  quiz: {
    logoUrl: string | null
    brandColor: string | null
    accentColor: string | null
  }
}): Promise<ResolvedBranding> {
  const owner = await db.user.findUnique({
    where: { id: params.ownerId },
    select: {
      name: true,
      company: true,
      memberProfile: {
        select: {
          businessName: true,
          logoUrl: true,
          brandColor: true,
          accentColor: true,
        },
      },
    },
  })

  const profile = owner?.memberProfile ?? null

  return {
    logoUrl: params.quiz.logoUrl ?? profile?.logoUrl ?? null,
    brandColor:
      params.quiz.brandColor ??
      profile?.brandColor ??
      DEFAULT_BRAND_COLOR,
    accentColor:
      params.quiz.accentColor ?? profile?.accentColor ?? null,
    ownerName: owner?.name ?? null,
    ownerCompany: profile?.businessName ?? owner?.company ?? null,
  }
}
