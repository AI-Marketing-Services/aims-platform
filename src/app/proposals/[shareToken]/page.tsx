import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import ReactMarkdown from "react-markdown"
import { FileText } from "lucide-react"
import { PrintButton } from "./PrintButton"
import { AcceptRejectActions } from "./AcceptRejectActions"

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

  const formattedDate = new Date(proposal.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      <style>{`
        @media print {
          body { background: #fff !important; color: #1a1a1a !important; }
          .print\\:hidden { display: none !important; }
          .prose { color: #1a1a1a !important; }
          .prose h1, .prose h2, .prose h3 { color: #1a1a1a !important; }
          .prose p, .prose li { color: #374151 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#08090D] text-[#F0EBE0]">
        {/* Header */}
        <header className="border-b px-6 py-4 print:border-b-2" style={{ borderColor: `${brandColor}30` }}>
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

            <div className="flex items-center gap-3">
              <PrintButton brandColor={brandColor} />
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ color: brandColor, borderColor: `${brandColor}40`, backgroundColor: `${brandColor}10` }}>
                Proposal
              </span>
            </div>
          </div>
        </header>

        {/* Proposal content */}
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{proposal.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for {proposal.clientDeal.companyName} · {formattedDate}
            </p>
          </div>

          <div className="bg-[#141923] rounded-xl p-8 border" style={{ borderColor: `${brandColor}20` }}>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{proposal.content}</ReactMarkdown>
            </div>
          </div>

          {proposal.totalValue > 0 && (
            <div className="mt-6 rounded-xl p-6 border" style={{ borderColor: `${brandColor}30`, backgroundColor: `${brandColor}08` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: brandColor }}>
                Total Value
              </p>
              <p className="text-2xl font-bold" style={{ color: brandColor }}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: proposal.currency || "USD",
                  minimumFractionDigits: 0,
                }).format(proposal.totalValue)}
              </p>
            </div>
          )}

          {/* Accept / decline actions — closes the deal-loop. Auto-creates
              a draft invoice on accept, advances the deal stage, notifies
              the operator. */}
          <div className="mt-8 print:hidden">
            <AcceptRejectActions
              shareToken={shareToken}
              proposalTitle={proposal.title}
              initialStatus={proposal.status}
              brandColor={brandColor}
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Questions? Contact {operatorName} directly.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
