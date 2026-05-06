import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Mic, Mail, ListChecks, Target, AlertTriangle, DollarSign, Users } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

interface CallSummary {
  summary?: string
  pains?: string[]
  budget?: string | null
  decisionMakers?: string[]
  objections?: string[]
  actionItems?: string[]
  scoreOutOf10?: number
  scoreReasoning?: string
}

export default async function RecordingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const dbUser = await ensureDbUser()
  const { id } = await params

  const recording = await db.callRecording.findFirst({
    where: { id, userId: dbUser.id },
  })
  if (!recording) notFound()

  const summary = (recording.summary as CallSummary | null) ?? {}

  return (
    <div className="space-y-6">
      <Link
        href="/portal/recordings"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        All recordings
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {recording.title}
            </h1>
            {recording.source && (
              <p className="text-sm text-muted-foreground">{recording.source}</p>
            )}
          </div>
        </div>
        {summary.scoreOutOf10 !== undefined && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Buyer score
            </p>
            <p className="text-3xl font-bold text-primary">
              {summary.scoreOutOf10}/10
            </p>
          </div>
        )}
      </div>

      {summary.summary && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-2">
            Executive summary
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {summary.summary}
          </p>
          {summary.scoreReasoning && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Score reasoning:</strong> {summary.scoreReasoning}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryBlock
          Icon={AlertTriangle}
          title="Pains"
          items={summary.pains ?? []}
        />
        <SummaryBlock
          Icon={Target}
          title="Objections"
          items={summary.objections ?? []}
        />
        <SummaryBlock
          Icon={Users}
          title="Decision-makers"
          items={summary.decisionMakers ?? []}
        />
        <SummaryBlock
          Icon={ListChecks}
          title="Action items"
          items={summary.actionItems ?? []}
        />
      </div>

      {summary.budget && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Budget signal
            </p>
            <p className="text-sm text-foreground">{summary.budget}</p>
          </div>
        </div>
      )}

      {recording.followUpDraft && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Follow-up draft
            </h2>
          </div>
          <pre className="p-5 text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {recording.followUpDraft}
          </pre>
        </div>
      )}

      <details className="rounded-2xl border border-border bg-card">
        <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-foreground select-none">
          View full transcript
        </summary>
        <pre className="px-5 py-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed border-t border-border max-h-96 overflow-y-auto">
          {recording.transcript}
        </pre>
      </details>
    </div>
  )
}

function SummaryBlock({
  Icon,
  title,
  items,
}: {
  Icon: typeof Target
  title: string
  items: string[]
}) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs font-bold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="text-xs text-muted-foreground flex items-start gap-2"
          >
            <span className="text-primary mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
