import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Share2, DollarSign, Users, Copy, CheckCircle } from "lucide-react"

export default async function ReferralsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const refCode = `AIMS-${user.id.slice(-6).toUpperCase()}`
  const refLink = `https://aimseos.com?ref=${refCode}`

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Referrals</h1>
        <p className="text-gray-400">Earn 20% commission for every business you refer to AIMS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Referred", value: "0", sub: "businesses", icon: Users },
          { label: "Active Clients", value: "0", sub: "from referrals", icon: CheckCircle },
          { label: "Total Earned", value: "$0", sub: "in commissions", icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#151821] border border-white/10 rounded-xl p-5">
            <stat.icon className="w-4 h-4 text-gray-500 mb-3" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-[#151821] border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#DC2626]" />
          Your Referral Link
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-[#0D0F14] border border-white/10 rounded-lg text-gray-300 text-sm font-mono truncate">
            {refLink}
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors whitespace-nowrap">
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Share this link. When someone signs up and pays, you earn 20% of their first 3 months.</p>
      </div>

      {/* How it works */}
      <div className="bg-[#151821] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-5">How the Referral Program Works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your link", desc: "Send your referral link to friends, colleagues, or your network" },
            { step: "2", title: "They sign up", desc: "When they book a call and become a paying client, you're credited" },
            { step: "3", title: "You earn 20%", desc: "Receive 20% of their monthly subscription for their first 3 months" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#DC2626]/20 text-[#DC2626] text-sm font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{item.title}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-white/5 text-xs text-gray-500">
          Want to earn ongoing commissions? <span className="text-[#DC2626] cursor-pointer hover:underline">Apply to become a Reseller Partner</span> for 20% recurring commissions.
        </div>
      </div>
    </div>
  )
}
