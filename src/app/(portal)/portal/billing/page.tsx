import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreditCard, Download, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { BillingPortalButton } from "./BillingPortalButton"

const DEMO_INVOICES = [
  { id: "inv_001", date: "2026-03-01", amount: 494, status: "paid", services: ["Website + CRM + Chatbot Bundle", "Cold Outbound System"] },
  { id: "inv_002", date: "2026-02-01", amount: 494, status: "paid", services: ["Website + CRM + Chatbot Bundle", "Cold Outbound System"] },
  { id: "inv_003", date: "2026-01-01", amount: 297, status: "paid", services: ["Website + CRM + Chatbot Bundle"] },
]

export default async function BillingPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing</h1>
        <p className="text-gray-500">Manage your subscription and payment history</p>
      </div>

      {/* Current plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Plan</div>
            <div className="text-xl font-bold text-gray-900 mb-1">Pro — 2 Active Services</div>
            <div className="text-gray-500 text-sm">$494/month · Renews April 1, 2026</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Payment Method</h3>
          <button className="text-sm text-[#DC2626] hover:text-[#B91C1C] transition-colors">Update</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="text-gray-900 font-medium">•••• •••• •••• 4242</div>
            <div className="text-gray-500 text-sm">Expires 12/27</div>
          </div>
        </div>
      </div>

      {/* Stripe portal link */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-gray-900 font-medium mb-0.5">Manage Subscription</div>
          <div className="text-gray-500 text-sm">Update payment method, cancel, or change plans in the Stripe billing portal</div>
        </div>
        <BillingPortalButton />
      </div>

      {/* Invoice history */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Invoice History</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Date</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden sm:table-cell">Services</th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Amount</th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEMO_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden sm:table-cell">
                    {inv.services.length === 1 ? inv.services[0] : `${inv.services.length} services`}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium text-right">${inv.amount}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed payment alert — demo */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Need to update your billing details? <Link href="#" className="underline font-medium">Update payment method</Link> to avoid service interruption.</span>
      </div>
    </div>
  )
}
