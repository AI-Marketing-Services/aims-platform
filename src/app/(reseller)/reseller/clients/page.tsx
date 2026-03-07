import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "My Clients" }

export default async function ResellerClientsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) redirect("/sign-in")

  const referral = await db.referral.findFirst({
    where: { referrerId: dbUser.id },
  })

  // Clients = users referred by this reseller with active subscriptions
  const referredUsers = referral
    ? await db.user.findMany({
        where: {
          referralReceived: { referrerId: dbUser.id },
        },
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { serviceArm: { select: { name: true } } },
          },
        },
      })
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All clients you referred to AIMS
        </p>
      </div>

      {referredUsers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No referred clients yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Share your referral link from the dashboard to start earning.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{referredUsers.length} referred client{referredUsers.length !== 1 ? "s" : ""}</h2>
          </div>
          <div className="divide-y divide-border">
            {referredUsers.map((client) => {
              const totalMRR = client.subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0)
              return (
                <div key={client.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.name ?? client.email}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {client.subscriptions.slice(0, 2).map((sub) => (
                        <span key={sub.id} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                          {sub.serviceArm.name}
                        </span>
                      ))}
                      {client.subscriptions.length > 2 && (
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                          +{client.subscriptions.length - 2}
                        </span>
                      )}
                    </div>
                    {totalMRR > 0 ? (
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                        <p className="text-sm font-mono font-semibold text-foreground">${totalMRR}/mo</p>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-400">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
