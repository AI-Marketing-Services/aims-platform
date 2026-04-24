import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { BrandingForm } from "./branding-form"

export const metadata = { title: "Branding Settings" }

export default async function BrandingPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/portal/dashboard")
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { memberProfile: true },
  })
  if (!dbUser) redirect("/sign-in")

  const profile = dbUser.memberProfile

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customise your white-label portal with your own logo, colors, and fonts.
        </p>
      </div>

      <BrandingForm
        initialValues={{
          businessName: profile?.businessName ?? "",
          tagline: profile?.tagline ?? "",
          logoUrl: profile?.logoUrl ?? "",
          faviconUrl: profile?.faviconUrl ?? "",
          brandColor: profile?.brandColor ?? "#C4972A",
          accentColor: profile?.accentColor ?? "#08090D",
          fontHeading: profile?.fontHeading ?? "DM Sans",
        }}
      />
    </div>
  )
}
