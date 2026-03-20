import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Share2, DollarSign, Users, CheckCircle, Mail, Linkedin, TrendingUp, ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/portal/CopyButton"

export default async function ReferralsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const refCode = `AIMS-${user.id.slice(-6).toUpperCase()}`
  const refLink = `https://aimseos.com?ref=${refCode}`
  const encodedRefLink = encodeURIComponent(refLink)

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Referrals</h1>
        <p className="text-muted-foreground">Earn 20% commission for every business you refer to AIMS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Referred", value: "0", sub: "businesses", icon: Users },
          { label: "Active Clients", value: "0", sub: "from referrals", icon: CheckCircle },
          { label: "Total Earned", value: "$0", sub: "in commissions", icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <stat.icon className="w-4 h-4 text-muted-foreground mb-3" />
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#C4972A]" />
          Your Referral Link
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-deep border border-border rounded-lg text-foreground text-sm font-mono truncate">
            {refLink}
          </div>
          <CopyButton text={refLink} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Share this link. When someone signs up and pays, you earn 20% of their first 3 months.</p>

        {/* Share via row */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wider">Share via</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={refLink} />
            <a
              href={`mailto:?subject=Check out AIMS&body=I use AIMS for AI-powered business automation. Check it out: ${refLink}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedRefLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=I%20use%20AIMS%20for%20AI%20automation%20%E2%80%94%20here%27s%20%2450%20off%20your%20first%20month%3A&url=${encodedRefLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-5">How the Referral Program Works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your link", desc: "Send your referral link to friends, colleagues, or your network" },
            { step: "2", title: "They sign up", desc: "When they book a call and become a paying client, you're credited" },
            { step: "3", title: "You earn 20%", desc: "Receive 20% of their monthly subscription for their first 3 months" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-[#C4972A] text-sm font-bold flex items-center justify-center flex-shrink-0 border border-primary/20">
                {item.step}
              </div>
              <div>
                <div className="text-foreground font-medium text-sm">{item.title}</div>
                <div className="text-muted-foreground text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earning projections */}
      <div className="bg-green-900/15 border border-green-800 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          Earning Potential
        </h3>
        <div className="space-y-4">
          <div className="bg-card border border-green-100 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">If 10 referrals sign up at $297/mo:</p>
            <p className="text-sm font-medium text-foreground">
              You earn:{" "}
              <span className="text-green-400 font-bold">$594/mo for 3 months</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-green-400 font-bold">$1,782 total</span>
            </p>
          </div>
          <div className="bg-card border border-green-100 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">If 5 referrals sign up at $497/mo:</p>
            <p className="text-sm font-medium text-foreground">
              You earn:{" "}
              <span className="text-green-400 font-bold">$497/mo for 3 months</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-green-400 font-bold">$1,491 total</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Commissions are calculated at 20% of the referred client&apos;s monthly amount for the first 3 months.</p>
      </div>

      {/* Reseller partner upgrade pitch */}
      <div className="border-l-4 border-l-[#C4972A] border border-border rounded-2xl bg-card p-6">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-[#C4972A] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Want ongoing commissions instead of just 3 months?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Become a Reseller Partner - earn <span className="font-semibold text-foreground">20% ONGOING</span> plus white-label your own portal.
            </p>
            <a
              href="/get-started?type=reseller"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C4972A] text-white text-sm font-semibold rounded-lg hover:bg-[#A17D22] transition-colors"
            >
              Apply for Reseller Partner
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
