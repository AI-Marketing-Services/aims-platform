import { Mail } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { ClientUpdatesClient } from "./ClientUpdatesClient"

export const metadata = { title: "Client Updates" }
export const dynamic = "force-dynamic"

export default async function ClientUpdatesPage() {
  const dbUser = await ensureDbUser()

  // Active retainers — the natural targets for weekly updates.
  const activeDeals = await db.clientDeal.findMany({
    where: { userId: dbUser.id, stage: "ACTIVE_RETAINER" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
    },
    take: 50,
  })

  const updates = await db.clientUpdate.findMany({
    where: { userId: dbUser.id },
    orderBy: { weekStartDate: "desc" },
    take: 30,
  })

  const serializedUpdates = updates.map((u) => ({
    id: u.id,
    clientDealId: u.clientDealId,
    status: u.status,
    weekStartDate: u.weekStartDate.toISOString(),
    subject: u.subject,
    body: u.body,
    sentAt: u.sentAt?.toISOString() ?? null,
    updatedAt: u.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Updates</h1>
          <p className="text-sm text-muted-foreground">
            Auto-drafted weekly recap emails for every active retainer.
          </p>
        </div>
      </div>

      <ClientUpdatesClient
        activeDeals={activeDeals}
        initialUpdates={serializedUpdates}
      />
    </div>
  )
}
