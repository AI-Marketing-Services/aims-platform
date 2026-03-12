import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreditCard, CheckCircle, Clock, AlertTriangle, ArrowRight, Download } from "lucide-react"
import Link from "next/link"
import { BillingPortalButton } from "./BillingPortalButton"
import { CancelSubscriptionButton } from "./CancelSubscriptionButton"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export const metadata = { title: "Billing" }

export default async function BillingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  let dbUser = null
  try {
    dbUser = await db.user.findUnique({
      where: { clerkId },
      include: {
        subscriptions: {
          include: { serviceArm: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  } catch {
    // DB failure — render gracefully
  }

  if (!dbUser) redirect("/sign-in")

  const allSubs = dbUser.subscriptions
  const activeSubs = allSubs.filter(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING"
  )
  const pastDueSubs = allSubs.filter((s) => s.status === "PAST_DUE")
  const totalMrr = activeSubs.reduce((sum, s) => sum + s.monthlyAmount, 0)
  const annualEquiv = totalMrr * 12
  const hasStripeCustomer = !!dbUser.stripeCustomerId

  // Fetch recent invoices from Stripe
  let invoices: Array<{
    id: string
    date: string
    amount: string
    status: string
    pdfUrl: string | null
  }> = []

  if (dbUser.stripeCustomerId) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: dbUser.stripeCustomerId,
        limit: 10,
      })
      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        date: new Date((inv.created ?? 0) * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        amount: `$${((inv.amount_paid ?? 0) / 100).toLocaleString()}`,
        status: inv.status ?? "unknown",
        pdfUrl: inv.invoice_pdf ?? null,
      }))
    } catch {
      // Stripe unavailable — show empty state
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing</h1>
        <p className="text-gray-500">Manage your subscriptions and payment details</p>
      </div>

      {/* Past-due alert */}
      {pastDueSubs.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {pastDueSubs.length === 1 ? "A payment" : `${pastDueSubs.length} payments`}{" "}
            failed for {pastDueSubs.map((s) => s.serviceArm.name).join(", ")}.{" "}
            <span className="font-medium underline cursor-pointer">
              Update your payment method below
            </span>{" "}
            to avoid service interruption.
          </span>
        </div>
      )}

      {/* Active subscriptions */}
      {activeSubs.length > 0 ? (
        <div className="rounded-2xl border border-border overflow-hidden mb-6">
          <div className="divide-y divide-border">
            {activeSubs.map((sub) => {
              const activeSince = sub.createdAt
                ? new Date(sub.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null
              const nextBilling = sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null

              return (
                <div key={sub.id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {sub.serviceArm.name}
                        </span>
                        {sub.tier && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {sub.tier}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activeSince && <span>Active since {activeSince}</span>}
                        {activeSince && nextBilling && <span> &middot; </span>}
                        {nextBilling && <span>Next billing: {nextBilling}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-semibold text-gray-900">
                        ${sub.monthlyAmount.toLocaleString()}/mo
                      </span>
                      <CancelSubscriptionButton
                        subscriptionId={sub.id}
                        serviceName={sub.serviceArm.name}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Totals row */}
            <div className="bg-muted/30 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Total Monthly</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Annual equivalent: ${(annualEquiv / 100).toLocaleString()}/yr
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">
                ${(totalMrr / 100).toLocaleString()}/mo
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 text-sm font-medium rounded-full border border-border w-fit mx-auto mb-3">
            <Clock className="w-3.5 h-3.5" />
            No active subscriptions
          </div>
          <p className="text-gray-500 text-sm mb-4">
            You don&apos;t have any active AIMS services yet.
          </p>
          <Link
            href="/portal/marketplace"
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
          >
            Browse Services
          </Link>
        </div>
      )}

      {/* Invoice history */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
        </div>
        <div className="divide-y divide-border">
          {/* Header row */}
          <div className="grid grid-cols-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-muted/20">
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {invoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              {hasStripeCustomer ? "No invoices yet." : "Invoice history available once billing is connected."}
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="grid grid-cols-4 px-5 py-3 text-sm items-center">
                <span className="text-gray-700">{inv.date}</span>
                <span className="font-medium text-gray-900">{inv.amount}</span>
                <span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      inv.status === "paid"
                        ? "bg-green-50 text-green-700"
                        : inv.status === "open"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </span>
                <span>
                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Payment Method</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 rounded-md border border-border flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-500 flex-1">
            {hasStripeCustomer
              ? "Card on file \u2014 managed via Stripe"
              : "No payment method on file"}
          </div>
          <BillingPortalButton />
        </div>
      </div>

      {/* Stripe portal */}
      <div className="bg-gray-50 border border-border rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-gray-900 font-medium mb-0.5">Manage Billing</div>
          <div className="text-gray-500 text-sm">
            Update payment method, download invoices, or cancel in the Stripe billing portal
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BillingPortalButton />
        </div>
      </div>

      {/* Invoice note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 mb-6">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Your invoice history and receipts are available in the{" "}
          <span className="font-medium">Stripe billing portal</span> above. Invoices are
          emailed automatically after each successful charge.
        </span>
      </div>

      {/* Add Service banner */}
      <div className="border border-border rounded-2xl bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-gray-600 text-sm">
          Want to add more services? Browse our marketplace to expand your AI stack.
        </p>
        <Link
          href="/portal/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors whitespace-nowrap shrink-0"
        >
          Browse Marketplace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
