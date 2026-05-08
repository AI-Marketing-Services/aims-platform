import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FolderOpen, Link as LinkIcon, ExternalLink, FileText, Download, Play } from "lucide-react"
import { CopyButton } from "@/components/portal/CopyButton"
import { getDubClient } from "@/lib/dub"

export const metadata = { title: "Partner Resources" }

const SALES_RESOURCES = [
  { title: "AIMS Partner Deck", desc: "Company overview, service catalog, pricing tiers", type: "PDF", href: "/resources/aims-partner-deck.txt" },
  { title: "Case Studies Pack", desc: "3 client results with before/after metrics", type: "PDF", href: "/resources/aims-case-studies.txt" },
  { title: "Onboarding Guide", desc: "Step-by-step partner onboarding and setup guide", type: "PDF", href: "/resources/aims-onboarding-guide.txt" },
  { title: "Cold Email Templates", desc: "5 proven subject lines and opening sequences", type: "Copy", href: "/resources/aims-cold-email-templates.txt" },
]

const VIDEO_RESOURCES = [
  { title: "Platform Walkthrough", desc: "15-min overview of all 15 services", type: "Video", href: "https://www.youtube.com/@aims-eos" },
  { title: "How to Pitch AIMS", desc: "Sales coaching from the team", type: "Video", href: "https://www.youtube.com/@aims-eos" },
  // Calendly is the canonical scheduler — Cal.com link removed (was the
  // legacy adamwolfe/aims handle). NEXT_PUBLIC_CALENDLY_RYAN is the
  // partnerships-team default; override per env if needed.
  { title: "Book a Strategy Call", desc: "1:1 session with the partnerships team", type: "Call", href: process.env.NEXT_PUBLIC_CALENDLY_RYAN ?? "https://calendly.com/ryan-breakthroughclosing" },
]

export default async function ResellerResourcesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({ where: { referrerId: dbUser.id } })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
  const refCode = referral?.code ?? ""

  // Try Dub.co links first, fall back to legacy format
  let primaryLink: string | null = null
  const dub = await getDubClient()
  if (dub && referral?.dubPartnerId) {
    try {
      const links = await dub.partners.retrieveLinks({ partnerId: referral.dubPartnerId })
      if (links.length > 0) primaryLink = links[0].shortLink
    } catch {
      // Fall through to legacy
    }
  }

  const refLink = referral
    ? primaryLink ?? `${baseUrl}/for/${referral.landingPageSlug ?? refCode}?ref=${refCode}`
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partner Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Sales materials, templates, and your referral links</p>
      </div>

      {/* Referral links */}
      {refLink && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Your Referral Links</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "General landing", url: refLink },
              { label: "Marketplace", url: primaryLink ? `${primaryLink}?page=marketplace` : `${baseUrl}/marketplace?ref=${refCode}` },
              { label: "AI Readiness Quiz", url: primaryLink ? `${primaryLink}?page=quiz` : `${baseUrl}/tools/ai-readiness-quiz?ref=${refCode}` },
              { label: "ROI Calculator", url: primaryLink ? `${primaryLink}?page=calculator` : `${baseUrl}/tools/roi-calculator?ref=${refCode}` },
            ].map(({ label, url }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground mb-0.5">{label}</p>
                  <code className="text-xs text-muted-foreground truncate block">{url}</code>
                </div>
                <CopyButton text={url} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales materials */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Sales Materials</h2>
        </div>
        <div className="divide-y divide-border">
          {SALES_RESOURCES.map((res) => (
            <div key={res.title} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{res.title}</p>
                  <p className="text-xs text-muted-foreground">{res.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{res.type}</span>
                <a
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Videos & Calls */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Training Videos & Coaching</h2>
        </div>
        <div className="divide-y divide-border">
          {VIDEO_RESOURCES.map((res) => (
            <div key={res.title} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <Play className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{res.title}</p>
                  <p className="text-xs text-muted-foreground">{res.desc}</p>
                </div>
              </div>
              <a
                href={res.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#981B1B] text-sm font-medium hover:underline"
              >
                {res.type === "Call" ? "Book" : "Watch"}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Request Custom Materials */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Request Custom Materials</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Need a co-branded deck, custom case study for a specific industry, or tailored pitch materials?
          Our partnerships team can create custom collateral for your pipeline.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the chatbot to request custom materials. It will gather your requirements and submit the request to our partnerships team.
        </p>
      </div>
    </div>
  )
}
