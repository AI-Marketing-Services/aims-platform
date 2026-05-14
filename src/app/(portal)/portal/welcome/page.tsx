import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { WelcomeWizard } from "@/components/portal/welcome/WelcomeWizard"

export const dynamic = "force-dynamic"
export const metadata = { title: "Welcome" }

/**
 * First-run interactive wizard. New signups land here automatically
 * (portal layout redirects them); explicit skippers can return later
 * via the sidebar resume widget.
 */
export default async function WelcomePage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: {
      name: true,
      firstRunStep: true,
      firstRunCompletedAt: true,
      firstRunSkippedAt: true,
      memberProfile: {
        select: {
          businessName: true,
          oneLiner: true,
          niche: true,
          idealClient: true,
          businessUrl: true,
          brandColor: true,
          tagline: true,
          logoUrl: true,
        },
      },
    },
  })
  if (!dbUser) redirect("/sign-in")

  return (
    <WelcomeWizard
      initial={{
        step:
          (dbUser.firstRunStep as
            | "intro"
            | "profile"
            | "branding"
            | "site"
            | "scout"
            | "connections"
            | "done"
            | null) ?? "intro",
        completedAt:
          dbUser.firstRunCompletedAt?.toISOString() ?? null,
        skippedAt: dbUser.firstRunSkippedAt?.toISOString() ?? null,
        profile: {
          businessName: dbUser.memberProfile?.businessName ?? null,
          oneLiner: dbUser.memberProfile?.oneLiner ?? null,
          niche: dbUser.memberProfile?.niche ?? null,
          idealClient: dbUser.memberProfile?.idealClient ?? null,
          businessUrl: dbUser.memberProfile?.businessUrl ?? null,
          brandColor: dbUser.memberProfile?.brandColor ?? null,
          tagline: dbUser.memberProfile?.tagline ?? null,
          logoUrl: dbUser.memberProfile?.logoUrl ?? null,
        },
        userName: dbUser.name ?? null,
      }}
    />
  )
}
