import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { searchKnowledge } from "@/lib/knowledge"
import { ArrowLeft, ExternalLink } from "lucide-react"

export const metadata = { title: "Knowledge Entry", robots: { index: false } }
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ entryId: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function KnowledgeEntryDetailPage({ params, searchParams }: Props) {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  const { entryId } = await params
  const { q } = await searchParams

  const entry = await db.knowledgeEntry.findUnique({ where: { id: entryId } })
  if (!entry) notFound()

  // Preview: run the same search the chatbot would with the same query
  // string (if provided) and show whether this entry was returned, at
  // what rank, and why. Makes it trivial to debug "why didn't the
  // chatbot find this?"
  let queryPreview: { rank: number; totalHits: number } | null = null
  if (q && q.trim().length >= 3) {
    const r = await searchKnowledge(q, 10)
    const idx = r.entries.findIndex((e) => e.id === entryId)
    queryPreview = { rank: idx >= 0 ? idx + 1 : -1, totalHits: r.entries.length }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/knowledge"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Knowledge Base
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
          {entry.source}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{entry.title}</h1>
        {entry.url && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
          >
            Open in Mighty <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Space" value={entry.spaceName ?? "—"} />
        <Stat label="Source ID" value={entry.sourceId} mono />
        <Stat
          label="Published"
          value={entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : "—"}
        />
        <Stat label="Indexed" value={new Date(entry.indexedAt).toLocaleDateString()} />
      </div>

      <form className="rounded-lg border border-border bg-card p-4" action={`/admin/knowledge/${entryId}`}>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          Search preview — does this entry rank for a query?
        </label>
        <div className="flex gap-2">
          <input
            name="q"
            type="text"
            defaultValue={q ?? ""}
            placeholder="e.g. getting started"
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
          >
            Test
          </button>
        </div>
        {queryPreview && (
          <p className="mt-3 text-sm">
            {queryPreview.rank > 0 ? (
              <span className="text-emerald-700">
                Rank <strong>#{queryPreview.rank}</strong> of {queryPreview.totalHits} hits for &quot;{q}&quot;.
              </span>
            ) : (
              <span className="text-amber-700">
                NOT in the top {queryPreview.totalHits} hits for &quot;{q}&quot;. The chatbot would not cite this entry.
              </span>
            )}
          </p>
        )}
      </form>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Plaintext (what the chatbot searches)</h2>
        <pre className="rounded-lg border border-border bg-card p-4 text-xs text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
          {entry.body || "(empty body)"}
        </pre>
      </div>

      {entry.tags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="inline-block px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.bodyHtml && (
        <details className="rounded-lg border border-border bg-card p-4">
          <summary className="text-sm font-semibold text-foreground cursor-pointer">
            Original HTML body (source-of-truth)
          </summary>
          <pre className="mt-3 text-[11px] text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
            {entry.bodyHtml}
          </pre>
        </details>
      )}
    </div>
  )
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""} text-foreground truncate`} title={value}>
        {value}
      </div>
    </div>
  )
}
