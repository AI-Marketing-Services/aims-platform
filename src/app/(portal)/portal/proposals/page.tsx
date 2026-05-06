import Link from "next/link"
import {
  FileSignature,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export const metadata = { title: "Proposals" }
export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, { label: string; tone: string; Icon: typeof Clock }> = {
  DRAFT: { label: "Draft", tone: "text-muted-foreground", Icon: Clock },
  SENT: { label: "Sent", tone: "text-primary", Icon: ExternalLink },
  ACCEPTED: { label: "Accepted", tone: "text-emerald-700", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", tone: "text-red-600", Icon: XCircle },
}

export default async function ProposalsIndexPage() {
  const dbUser = await ensureDbUser()

  const proposals = await db.clientProposal.findMany({
    where: { clientDeal: { userId: dbUser.id } },
    include: {
      clientDeal: { select: { id: true, companyName: true, contactName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
            <p className="text-sm text-muted-foreground">
              Branded proposals across every deal — track sent, accepted, and signed.
            </p>
          </div>
        </div>
        <Link
          href="/portal/crm"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New from a deal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <FileSignature className="h-7 w-7 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground mb-1">No proposals yet</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Open any deal in your CRM and click &ldquo;Generate proposal&rdquo;
            to create your first branded proposal with a shareable link.
          </p>
          <Link
            href="/portal/crm"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Open CRM
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
            <div className="col-span-4">Title</div>
            <div className="col-span-3">Deal</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Updated</div>
            <div className="col-span-1 text-right">Open</div>
          </div>
          <div className="divide-y divide-border">
            {proposals.map((p) => {
              const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.DRAFT
              const Icon = status.Icon
              return (
                <Link
                  key={p.id}
                  href={`/portal/crm/${p.clientDealId}/proposals/${p.id}`}
                  className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-5 py-3.5 text-sm hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-2 sm:col-span-4 font-semibold text-foreground truncate">
                    {p.title}
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-muted-foreground truncate">
                    {p.clientDeal.companyName}
                    {p.clientDeal.contactName ? ` · ${p.clientDeal.contactName}` : null}
                  </div>
                  <div className="col-span-1 sm:col-span-2 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${status.tone}`} />
                    <span className={`text-xs font-medium ${status.tone}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="hidden sm:flex col-span-1 items-center justify-end">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
