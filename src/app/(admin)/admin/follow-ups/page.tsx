import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FollowUpsClient, type PartialRow } from "./FollowUpsClient"

export const dynamic = "force-dynamic"

export default async function FollowUpsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  // Abandoned-app queue: they started the form and we already sent them the
  // auto-reminder email. They still haven't finished. These are the names
  // worth a phone call or a personal text — the email didn't move them.
  const [needsOutreach, alreadyContacted, dismissed, totals] = await Promise.all([
    db.partialApplication.findMany({
      where: {
        reminderSentAt: { not: null },
        dealId: null,
        completedAt: null,
        contactedAt: null,
        dismissedAt: null,
      },
      orderBy: { reminderSentAt: "desc" },
      take: 100,
    }),
    db.partialApplication.findMany({
      where: {
        contactedAt: { not: null },
        dealId: null,
        dismissedAt: null,
      },
      orderBy: { contactedAt: "desc" },
      take: 50,
    }),
    db.partialApplication.findMany({
      where: { dismissedAt: { not: null }, dealId: null },
      orderBy: { dismissedAt: "desc" },
      take: 50,
    }),
    db.partialApplication.groupBy({
      by: ["dealId"],
      _count: { _all: true },
    }),
  ])

  const finishedCount = totals.find((t) => t.dealId !== null)?._count._all ?? 0
  const stillOpenCount = totals.find((t) => t.dealId === null)?._count._all ?? 0

  const toRow = (p: typeof needsOutreach[number]): PartialRow => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    source: p.source,
    utmSource: p.utmSource,
    utmCampaign: p.utmCampaign,
    createdAt: p.createdAt.toISOString(),
    reminderSentAt: p.reminderSentAt?.toISOString() ?? null,
    contactedAt: p.contactedAt?.toISOString() ?? null,
    contactedBy: p.contactedBy,
    contactNote: p.contactNote,
    dismissedAt: p.dismissedAt?.toISOString() ?? null,
  })

  return (
    <FollowUpsClient
      needsOutreach={needsOutreach.map(toRow)}
      alreadyContacted={alreadyContacted.map(toRow)}
      dismissed={dismissed.map(toRow)}
      finishedCount={finishedCount}
      stillOpenCount={stillOpenCount}
    />
  )
}
