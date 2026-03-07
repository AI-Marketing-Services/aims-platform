import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreditCard, CheckCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { BillingPortalButton } from "./BillingPortalButton"
import { db } from "@/lib/db"

export const metadata = { title: "Billing" }

const statusColors: Record<string, string> = {
  ACTIVE: "text-green-700 bg-green-50 border-green-200",
  TRIALING: "text-blue-700 bg-blue-50 border-blue-200",
  PAST_DUE: "text-red-700 bg-red-50 border-red-200",
  PAUSED: "text-gray-500 bg-gray-50 border-gray-200",
  CANCELLED: "text-gray-500 bg-gray-50 border-gray-200",
}

export default async function BillingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: {
      subscriptions: {
        include: { serviceArm: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!dbUser) redirect("/sign-in")

  const activeSubs = dbUser.subscriptions.filter(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING"
  )
  const pastDueSubs = dbUser.subscriptions.filter((s) => s.status === "PAST_DUE")
  const totalMrr = activeSubs.reduce((sum, s) => sum + s.monthlyAmount, 0)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing</h1>
        <p className="text-gray-500">Manage your subscriptions and payment details</p>
      </div>

      {/* Past-due alert */}
      {pastDueSubs.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {pastDueSubs.length === 1 ? "A payment" : `${pastDueSubs.length} payments`} failed for{" "}
            {pastDueSubs.map((s) => s.serviceArm.name).join(", ")}.{" "}
            <span className="font-medium underline cursor-pointer">Update your payment method below</span> to avoid service interruption.
          </span>
        </div>
      )}

      {/* Subscription summary */}
      {activeSubs.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Active Plan</div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {activeSubs.length === 1
                  ? activeSubs[0].serviceArm.name
                  : `${activeSubs.length} Active Services`}
              </div>
              <div className="text-gray-500 text-sm">
                ${totalMrr.toLocaleString()}/month
                {activeSubs[0]?.currentPeriodEnd && (
                  <> · Renews {new Date(activeSubs[0].currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200 shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              Active
            </div>
          </div>

          {/* Individual subscriptions */}
          {activeSubs.length > 1 && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              {activeSubs.map((sub) => {
                const cls = statusColors[sub.status] ?? "text-gray-500 bg-gray-50 border-gray-200"
                return (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {sub.serviceArm.name}
                      {sub.tier && <span className="ml-1.5 text-gray-400">({sub.tier})</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">${sub.monthlyAmount.toLocaleString()}/mo</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{sub.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 text-sm font-medium rounded-full border border-gray-200 w-fit mx-auto mb-3">
            <Clock className="w-3.5 h-3.5" />
            No active subscriptions
          </div>
          <p className="text-gray-500 text-sm mb-4">You don&apos;t have any active AIMS services yet.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
          >
            Browse Services
          </Link>
        </div>
      )}

      {/* Payment method */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Payment Method</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-500">
            Managed securely by Stripe. Use the portal below to update your card.
          </div>
        </div>
      </div>

      {/* Stripe portal */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-gray-900 font-medium mb-0.5">Manage Billing</div>
          <div className="text-gray-500 text-sm">Update payment method, download invoices, or cancel in the Stripe billing portal</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BillingPortalButton />
          <Link
            href="/marketplace"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition"
          >
            <ExternalLink className="w-4 h-4" />
            Add Service
          </Link>
        </div>
      </div>

      {/* Invoice note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Your invoice history and receipts are available in the{" "}
          <span className="font-medium">Stripe billing portal</span> above. Invoices are emailed automatically after each successful charge.
        </span>
      </div>
    </div>
  )
}
