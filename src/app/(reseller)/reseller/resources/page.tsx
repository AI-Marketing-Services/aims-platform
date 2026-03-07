import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FolderOpen, Link as LinkIcon, ExternalLink, FileText } from "lucide-react"
import { CopyButton } from "@/components/portal/CopyButton"

export const metadata = { title: "Partner Resources" }

const SALES_RESOURCES = [
  { title: "AIMS Partner Deck", desc: "Company overview, service catalog, pricing tiers", type: "PDF", href: "#" },
  { title: "Case Studies Pack", desc: "3 client results with before/after metrics", type: "PDF", href: "#" },
  { title: "ROI Calculator Template", desc: "Spreadsheet to model client ROI before pitching", type: "Sheet", href: "#" },
  { title: "Cold Email Templates", desc: "5 proven subject lines and opening sequences", type: "Copy", href: "#" },
]

const VIDEO_RESOURCES = [
  { title: "Platform Walkthrough", desc: "15-min overview of all 15 services", type: "Video", href: "#" },
  { title: "How to Pitch AIMS", desc: "Sales coaching from the team", type: "Video", href: "#" },
]

export default async function ResellerResourcesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({ where: { referrerId: dbUser.id } })
  const baseUrl = "https://aimseos.com"
  const refCode = referral?.code ?? ""
  const refLink = referral ? `${baseUrl}/for/${referral.landingPageSlug ?? refCode}?ref=${refCode}` : null

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
              { label: "Marketplace", url: `${baseUrl}/marketplace?ref=${refCode}` },
              { label: "AI Readiness Quiz", url: `${baseUrl}/tools/ai-readiness-quiz?ref=${refCode}` },
              { label: "ROI Calculator", url: `${baseUrl}/tools/roi-calculator?ref=${refCode}` },
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
                <a href={res.href} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Videos */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Training Videos</h2>
        </div>
        <div className="divide-y divide-border">
          {VIDEO_RESOURCES.map((res) => (
            <div key={res.title} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{res.title}</p>
                <p className="text-xs text-muted-foreground">{res.desc}</p>
              </div>
              <a href={res.href} className="text-[#DC2626] text-sm font-medium hover:underline">
                Watch
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
