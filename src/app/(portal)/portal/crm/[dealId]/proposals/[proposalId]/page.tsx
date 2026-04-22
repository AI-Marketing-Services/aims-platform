import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { ProposalEditor } from "@/components/portal/crm/ProposalEditor"
import { ChevronLeft } from "lucide-react"

async function getProposal(proposalId: string, clerkId: string) {
  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!dbUser) return null

  return db.clientProposal.findFirst({
    where: { id: proposalId, clientDeal: { userId: dbUser.id } },
    include: { clientDeal: { select: { id: true, companyName: true } } },
  })
}

export const dynamic = "force-dynamic"

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ dealId: string; proposalId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { dealId, proposalId } = await params
  const proposal = await getProposal(proposalId, userId)
  if (!proposal) notFound()

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      <Link
        href={`/portal/crm/${dealId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to {proposal.clientDeal.companyName}
      </Link>

      <ProposalEditor
        proposalId={proposalId}
        dealId={dealId}
        initialTitle={proposal.title}
        initialContent={proposal.content}
        initialStatus={proposal.status}
        shareToken={proposal.shareToken}
        companyName={proposal.clientDeal.companyName}
      />
    </div>
  )
}
