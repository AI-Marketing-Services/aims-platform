import { Brain, FileText, RefreshCw, Sparkles, ArrowRight } from "lucide-react"

export const metadata = { title: "Knowledge Base Pro" }

/**
 * /portal/knowledge
 *
 * Real surface — placeholder until we wire the document upload + RAG
 * indexer. The portal-wide AI surfaces (Deal Assistant, Chatbot, Voice
 * Agent) read from this knowledge base before answering.
 */
export default function KnowledgeProPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base Pro</h1>
          <p className="text-sm text-muted-foreground">
            Upload docs, transcripts, and SOPs. Every AI on the platform reads from
            your knowledge base before answering.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<FileText className="h-4 w-4" />} label="Documents indexed" value="0" />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="AI surfaces consuming" value="3" />
        <Stat icon={<RefreshCw className="h-4 w-4" />} label="Last re-index" value="—" />
        <Stat icon={<Brain className="h-4 w-4" />} label="Total tokens stored" value="0" />
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Add your first document</h2>
        <p className="text-sm text-muted-foreground">
          PDF, Markdown, plain text, Loom transcripts, YouTube transcripts. Drop it
          in once and Deal Assistant + Chatbot + Voice Agent all start using it.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 w-fit"
        >
          Upload document
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold mt-2 tabular-nums text-foreground">{value}</div>
    </div>
  )
}
