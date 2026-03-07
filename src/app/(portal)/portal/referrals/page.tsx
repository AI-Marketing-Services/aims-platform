import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Share2, DollarSign, Users, CheckCircle } from "lucide-react"
import { CopyButton } from "@/components/portal/CopyButton"

export default async function ReferralsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const refCode = `AIMS-${user.id.slice(-6).toUpperCase()}`
  const refLink = `https://aimseos.com?ref=${refCode}`

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Referrals</h1>
        <p className="text-gray-500">Earn 20% commission for every business you refer to AIMS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Referred", value: "0", sub: "businesses", icon: Users },
          { label: "Active Clients", value: "0", sub: "from referrals", icon: CheckCircle },
          { label: "Total Earned", value: "$0", sub: "in commissions", icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <stat.icon className="w-4 h-4 text-gray-400 mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#DC2626]" />
          Your Referral Link
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm font-mono truncate">
            {refLink}
          </div>
          <CopyButton text={refLink} />
        </div>
        <p className="text-xs text-gray-500 mt-3">Share this link. When someone signs up and pays, you earn 20% of their first 3 months.</p>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-5">How the Referral Program Works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your link", desc: "Send your referral link to friends, colleagues, or your network" },
            { step: "2", title: "They sign up", desc: "When they book a call and become a paying client, you're credited" },
            { step: "3", title: "You earn 20%", desc: "Receive 20% of their monthly subscription for their first 3 months" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-red-50 text-[#DC2626] text-sm font-bold flex items-center justify-center flex-shrink-0 border border-red-100">
                {item.step}
              </div>
              <div>
                <div className="text-gray-900 font-medium text-sm">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500">
          Want to earn ongoing commissions? <span className="text-[#DC2626] cursor-pointer hover:underline">Apply to become a Reseller Partner</span> for 20% recurring commissions.
        </div>
      </div>
    </div>
  )
}
