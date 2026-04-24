import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { getKnowledgeStats } from "@/lib/knowledge"
import { BookOpenText, AlertTriangle } from "lucide-react"
import { KnowledgeAdminClient } from "./KnowledgeAdminClient"

export const metadata = { title: "Knowledge Base", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function AdminKnowledgePage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  const mightyConfigured = !!process.env.MIGHTY_API_TOKEN

  const [stats, recentRuns, recentEntries] = await Promise.all([
    getKnowledgeStats(),
    db.knowledgeIngestRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    db.knowledgeEntry.findMany({
      orderBy: { indexedAt: "desc" },
      take: 20,
      select: {
        id: true,
        source: true,
        title: true,
        url: true,
        spaceName: true,
        publishedAt: true,
        indexedAt: true,
      },
    }),
  ])

  const serializedRuns = recentRuns.map((r) => ({
    id: r.id,
    status: r.status,
    trigger: r.trigger,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    itemsSeen: r.itemsSeen,
    itemsUpserted: r.itemsUpserted,
    itemsFailed: r.itemsFailed,
    errorMessage: r.errorMessage,
  }))

  const serializedEntries = recentEntries.map((e) => ({
    id: e.id,
    source: e.source,
    title: e.title,
    url: e.url,
    spaceName: e.spaceName,
    publishedAt: e.publishedAt?.toISOString() ?? null,
    indexedAt: e.indexedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
          CHATBOT · KNOWLEDGE BASE
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpenText className="h-6 w-6 text-primary" />
          Knowledge Base
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mighty Networks content indexed for the portal chatbot. Members&apos; questions are answered with citations back to these entries.
        </p>
      </div>

      {!mightyConfigured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Mighty Networks API not configured</p>
            <p className="text-muted-foreground mt-1">
              Set <code className="font-mono bg-muted px-1 py-0.5 rounded">MIGHTY_API_TOKEN</code> in environment to enable ingestion.
              Until then, the portal chatbot falls back to its base system prompt.
            </p>
          </div>
        </div>
      )}

      <KnowledgeAdminClient
        stats={stats}
        runs={serializedRuns}
        entries={serializedEntries}
        canRun={mightyConfigured}
      />
    </div>
  )
}
