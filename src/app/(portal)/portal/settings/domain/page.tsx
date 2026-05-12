import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { isVercelDomainsConfigured } from "@/lib/vercel-domains"
import { DomainManager } from "./domain-manager"

export const metadata = { title: "Domain Settings" }

export default async function DomainPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { operatorSite: true },
  })
  if (!dbUser) redirect("/sign-in")

  const site = dbUser.operatorSite
  const vercelConfigured = isVercelDomainsConfigured()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Domain</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your platform subdomain and connect a custom domain.
        </p>
      </div>

      <DomainManager
        initialSubdomain={site?.subdomain ?? ""}
        initialCustomDomain={site?.customDomain ?? null}
        initialVerified={site?.customDomainVerified ?? false}
        initialPublished={site?.isPublished ?? false}
        vercelConfigured={vercelConfigured}
      />
    </div>
  )
}
