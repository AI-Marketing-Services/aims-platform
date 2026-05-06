import Link from "next/link"
import { Bot, ArrowRight, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export const metadata = { title: "Deal Assistant" }
export const dynamic = "force-dynamic"

export default async function DealAssistantPage() {
  const dbUser = await ensureDbUser()

  // Recent deals so the operator can drop straight into the assistant
  // for any of them. Skip lost/won — assistant is best on live deals.
  const deals = await db.clientDeal.findMany({
    where: {
      userId: dbUser.id,
      stage: { notIn: ["LOST", "COMPLETED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      companyName: true,
      contactName: true,
      stage: true,
      leadScore: true,
      updatedAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deal Assistant</h1>
          <p className="text-sm text-muted-foreground">
            An AI co-pilot embedded inside every deal — knows your pipeline.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              How to use it
            </h2>
            <p className="text-sm text-muted-foreground">
              Open any deal in your CRM and click <span className="font-bold">Ask Assistant</span>{" "}
              in the right sidebar. The Assistant has full context — company,
              contact, audit response, proposals, last touch — and can:
            </p>
          </div>
        </div>
        <ul className="space-y-2 ml-8 mb-6">
          {[
            "Recommend the next best action by stage",
            "Draft personalized follow-up emails",
            "Score the deal 1-10 with reasoning + risks",
            "Summarize where this deal stands this week",
            "Answer any open question grounded in your CRM data",
          ].map((b) => (
            <li
              key={b}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <span className="text-primary mt-0.5">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Open in a deal
        </h2>
        {deals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No active deals yet. Create your first deal and the Assistant will be ready.
            </p>
            <Link
              href="/portal/crm"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open CRM
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deals.map((d) => (
              <Link
                key={d.id}
                href={`/portal/crm/${d.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {d.companyName}
                  </h3>
                  {d.leadScore !== null && d.leadScore !== undefined ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      {d.leadScore}/100
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground truncate mb-3">
                  {d.contactName ?? "—"} · {d.stage.replace("_", " ").toLowerCase()}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Bot className="h-3.5 w-3.5" />
                  Ask Assistant
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
