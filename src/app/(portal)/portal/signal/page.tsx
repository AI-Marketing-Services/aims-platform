import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { startOfUtcDay } from "@/lib/signal/digest"
import { Settings, Rss, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Signal · AIMS", robots: { index: false } }

type Item = {
  topicId: string
  topicLabel: string
  headline: string
  summary: string
  url: string
  source: string
  publishedAt?: string
}

export default async function SignalPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      notifSignalDigest: true,
      signalTopics: { where: { enabled: true }, select: { id: true, label: true } },
    },
  })
  if (!user) redirect("/sign-in")

  const today = startOfUtcDay()
  const run = await db.signalDigestRun.findUnique({
    where: { userId_runDate: { userId: user.id, runDate: today } },
    select: { items: true, sentAt: true, status: true },
  })

  const items = (run?.items as unknown as Item[] | null) ?? []
  const dateLabel = today.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const hasTopics = user.signalTopics.length > 0
  const empty = items.length === 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Rss className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Signal</h1>
          </div>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <Link
          href="/portal/signal/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface border border-border/50 hover:border-border transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-xs text-muted-foreground">
        <span>
          {run?.sentAt
            ? `Delivered at ${run.sentAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : run?.status === "EMPTY"
            ? "No news matched your topics today"
            : "Digest runs daily at 10:00 UTC"}
        </span>
        <span className="text-foreground font-medium">
          {hasTopics ? `${user.signalTopics.length} topic${user.signalTopics.length !== 1 ? "s" : ""} tracked` : "No topics yet"}
        </span>
      </div>

      {/* No topics CTA */}
      {!hasTopics && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Rss className="h-10 w-10 text-primary/30 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-foreground mb-2">Set up your daily briefing</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Signal pulls the top news stories for your chosen topics every morning — delivered by 10am UTC.
          </p>
          <Link
            href="/portal/signal/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configure Topics
          </Link>
        </div>
      )}

      {/* Has topics but empty today */}
      {hasTopics && empty && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-1">No stories today.</p>
          <p className="text-xs text-muted-foreground/60">No filler, no fluff — only relevant news makes the cut.</p>
        </div>
      )}

      {/* Stories */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            {items.length} {items.length === 1 ? "story" : "stories"} today
          </p>
          {items.map((it) => (
            <a
              key={it.topicId + it.url}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-card/80 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                  {it.topicLabel}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors mt-0.5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                {it.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{it.summary}</p>
              <p className="text-xs text-muted-foreground/60 font-medium">{it.source}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
