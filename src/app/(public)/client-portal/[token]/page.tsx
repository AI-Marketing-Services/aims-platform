import { notFound } from "next/navigation"

interface Contact {
  id: string
  firstName: string
  lastName: string | null
  title: string | null
  email: string | null
  isPrimary: boolean
}

interface Proposal {
  id: string
  title: string
  status: string
  shareToken: string | null
  totalValue: number
  currency: string
  sentAt: string | null
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  status: string
  total: number
  currency: string
  dueAt: string | null
  stripePaymentLink: string | null
  shareToken: string | null
}

interface PortalData {
  guest: { email: string; name: string | null }
  operator: {
    businessName: string | null
    logoUrl: string | null
    brandColor: string
    tagline: string | null
  }
  deal: {
    id: string
    companyName: string
    stage: string
    value: number
    currency: string
    contacts: Contact[]
    proposals: Proposal[]
    invoices: Invoice[]
  }
}

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  DISCOVERY_CALL: "Discovery",
  PROPOSAL_SENT: "Proposal Sent",
  ACTIVE_RETAINER: "Active Retainer",
  COMPLETED: "Completed",
  LOST: "Lost",
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "bg-gray-700 text-gray-200",
  DISCOVERY_CALL: "bg-blue-900 text-blue-200",
  PROPOSAL_SENT: "bg-amber-900 text-amber-200",
  ACTIVE_RETAINER: "bg-green-900 text-green-200",
  COMPLETED: "bg-emerald-900 text-emerald-200",
  LOST: "bg-red-900 text-red-200",
}

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
}

const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  SENT: "bg-blue-900 text-blue-200",
  ACCEPTED: "bg-emerald-900 text-emerald-200",
  REJECTED: "bg-red-900 text-red-200",
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  SENT: "bg-blue-900 text-blue-200",
  PAID: "bg-emerald-900 text-emerald-200",
  OVERDUE: "bg-red-900 text-red-200",
  CANCELLED: "bg-gray-700 text-gray-400",
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

async function fetchPortalData(token: string): Promise<PortalData | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  try {
    const res = await fetch(`${appUrl}/api/client-portal/${token}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json() as Promise<PortalData>
  } catch {
    return null
  }
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await fetchPortalData(token)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#08090D" }}>
        <div
          className="max-w-md w-full rounded-lg border p-10 text-center"
          style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
        >
          <div className="text-4xl mb-4" aria-hidden>
            🔒
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: "#F0EBE0" }}>
            Link Unavailable
          </h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            This link has expired or is no longer valid. Contact your operator for a new link.
          </p>
        </div>
      </div>
    )
  }

  const { operator, deal } = data
  const brandColor = operator.brandColor ?? "#C4972A"

  return (
    <div className="min-h-screen" style={{ background: "#08090D", color: "#F0EBE0", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Brand top bar */}
      <div style={{ background: brandColor, height: "4px" }} />

      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
      >
        <div className="flex items-center gap-3">
          {operator.logoUrl && (
            <img
              src={operator.logoUrl}
              alt={operator.businessName ?? "Operator logo"}
              className="h-8 w-8 rounded object-contain"
            />
          )}
          <span className="text-lg font-semibold" style={{ color: "#F0EBE0" }}>
            {operator.businessName ?? "Your Project Portal"}
          </span>
        </div>
        {operator.tagline && (
          <span className="text-sm hidden sm:block" style={{ color: "#9CA3AF" }}>
            {operator.tagline}
          </span>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Deal summary card */}
        <section
          className="rounded-lg border p-6"
          style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                Project
              </p>
              <h2 className="text-2xl font-semibold" style={{ color: "#F0EBE0" }}>
                {deal.companyName}
              </h2>
              {deal.value > 0 && (
                <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                  {formatCurrency(deal.value, deal.currency)}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${STAGE_COLORS[deal.stage] ?? "bg-gray-700 text-gray-300"}`}
            >
              {STAGE_LABELS[deal.stage] ?? deal.stage}
            </span>
          </div>
        </section>

        {/* Proposals */}
        {deal.proposals.length > 0 && (
          <section>
            <h3
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: "#9CA3AF" }}
            >
              Proposals
            </h3>
            <div className="space-y-3">
              {deal.proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-lg border p-4 flex items-center justify-between gap-4 flex-wrap"
                  style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#F0EBE0" }}>
                      {proposal.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {proposal.sentAt ? `Sent ${formatDate(proposal.sentAt)}` : `Created ${formatDate(proposal.createdAt)}`}
                      {proposal.totalValue > 0 && ` · ${formatCurrency(proposal.totalValue, proposal.currency)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PROPOSAL_STATUS_COLORS[proposal.status] ?? "bg-gray-700 text-gray-300"}`}
                    >
                      {PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
                    </span>
                    {proposal.shareToken && (
                      <a
                        href={`/portal/proposals/${proposal.shareToken}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
                        style={{ background: brandColor, color: "#08090D" }}
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invoices */}
        {deal.invoices.length > 0 && (
          <section>
            <h3
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: "#9CA3AF" }}
            >
              Invoices
            </h3>
            <div className="space-y-3">
              {deal.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-lg border p-4 flex items-center justify-between gap-4 flex-wrap"
                  style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#F0EBE0" }}>
                      {invoice.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {invoice.invoiceNumber}
                      {invoice.dueAt && ` · Due ${formatDate(invoice.dueAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold" style={{ color: "#F0EBE0" }}>
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[invoice.status] ?? "bg-gray-700 text-gray-300"}`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.stripePaymentLink && invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                      <a
                        href={invoice.stripePaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
                        style={{ background: brandColor, color: "#08090D" }}
                      >
                        Pay
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {deal.proposals.length === 0 && deal.invoices.length === 0 && (
          <div
            className="rounded-lg border p-8 text-center"
            style={{ background: "#141923", borderColor: "rgba(240,235,224,0.08)" }}
          >
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Your operator will share proposals and invoices here as the project progresses.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs" style={{ color: "#4B5563" }}>
          Powered by{" "}
          <a
            href="https://aioperatorcollective.com"
            className="transition-colors hover:opacity-80"
            style={{ color: "#C4972A" }}
          >
            AI Operator Collective
          </a>
        </p>
      </footer>
    </div>
  )
}
