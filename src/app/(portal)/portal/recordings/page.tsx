import Link from "next/link"
import { Mic } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { RecordingsClient } from "./RecordingsClient"

export const metadata = { title: "Discovery Recorder" }
export const dynamic = "force-dynamic"

export default async function RecordingsPage() {
  const dbUser = await ensureDbUser()

  const [recordings, deals] = await Promise.all([
    db.callRecording.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        source: true,
        clientDealId: true,
        createdAt: true,
        summary: true,
      },
    }),
    db.clientDeal.findMany({
      where: { userId: dbUser.id, stage: { notIn: ["LOST", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, companyName: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Discovery Recorder
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste a call transcript, get an AI buyer summary + draft follow-up.
          </p>
        </div>
      </div>

      <RecordingsClient
        deals={deals}
        initialRecordings={recordings.map((r) => ({
          id: r.id,
          title: r.title,
          source: r.source,
          clientDealId: r.clientDealId,
          createdAt: r.createdAt.toISOString(),
          summary: r.summary as Record<string, unknown> | null,
        }))}
      />
    </div>
  )
}
