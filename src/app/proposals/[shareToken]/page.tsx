import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import ReactMarkdown from "react-markdown"
import { FileText } from "lucide-react"

async function getProposal(shareToken: string) {
  return db.clientProposal.findUnique({
    where: { shareToken },
    include: {
      clientDeal: {
        include: {
          user: {
            include: { memberProfile: { select: { businessName: true, logoUrl: true, oneLiner: true, brandColor: true, tagline: true } } },
          },
        },
      },
    },
  })
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const { shareToken } = await params
  const proposal = await getProposal(shareToken)
  if (!proposal) notFound()

  const operator = proposal.clientDeal.user
  const profile = operator.memberProfile
  const operatorName = profile?.businessName ?? operator.name ?? "AI Operator"
  const brandColor = profile?.brandColor ?? "#C4972A"

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F0EBE0]">
      {/* Header */}
      <header className="border-b px-6 py-4" style={{ borderColor: `${brandColor}30` }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt={operatorName} className="h-8 w-8 rounded object-contain" />
            ) : (
              <div className="h-8 w-8 rounded flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                <FileText className="h-4 w-4" style={{ color: brandColor }} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{operatorName}</p>
              {(profile?.tagline ?? profile?.oneLiner) && (
                <p className="text-[11px] text-muted-foreground">{profile?.tagline ?? profile?.oneLiner}</p>
              )}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ color: brandColor, borderColor: `${brandColor}40`, backgroundColor: `${brandColor}10` }}>
            Proposal
          </span>
        </div>
      </header>

      {/* Proposal content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{proposal.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepared for {proposal.clientDeal.companyName} ·{" "}
            {new Date(proposal.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="bg-[#141923] rounded-xl p-8 border" style={{ borderColor: `${brandColor}20` }}>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{proposal.content}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Questions? Reply directly to this email or contact {operatorName}.
          </p>
        </div>
      </main>
    </div>
  )
}
