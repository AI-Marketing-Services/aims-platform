import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { startOfUtcDay } from "@/lib/signal/digest"

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
    select: { id: true, notifSignalDigest: true, signalTopics: { where: { enabled: true }, select: { id: true } } },
  })
  if (!user) redirect("/sign-in")

  const today = startOfUtcDay()
  const run = await db.signalDigestRun.findUnique({
    where: { userId_runDate: { userId: user.id, runDate: today } },
    select: { items: true, sentAt: true, status: true },
  })

  const items = (run?.items as unknown as Item[] | null) ?? []
  const dateLabel = today.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" })

  const empty = items.length === 0

  return (
    <div className="mx-auto max-w-[560px] px-6 py-14">
      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 mb-2">{dateLabel}</div>
        <h1 className="font-serif text-4xl text-foreground">Signal</h1>
        <div className="font-mono text-[11px] text-foreground/50 mt-1">
          {empty ? "no stories today" : `${items.length} ${items.length === 1 ? "story" : "stories"}`}
        </div>
      </div>

      <div className="border-t border-border/40 pt-8">
        {empty ? <EmptyState hasTopics={user.signalTopics.length > 0} enabled={user.notifSignalDigest} /> : (
          <ul className="space-y-7">
            {items.map((it) => (
              <li key={it.topicId + it.url}>
                <Link href={it.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary mb-2">
                    {it.topicLabel}
                  </div>
                  <div className="font-serif text-xl leading-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                    {it.headline}
                  </div>
                  <div className="text-sm text-foreground/70 leading-relaxed mb-2">
                    {it.summary}
                  </div>
                  <div className="font-mono text-[11px] text-primary/80">
                    {it.source} &rarr;
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-14 pt-6 border-t border-border/40 font-mono text-[10px] text-foreground/40 flex justify-between">
        <span>{run?.sentAt ? `delivered ${run.sentAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : run?.status === "EMPTY" ? "no signal today" : "not yet run"}</span>
        <Link href="/portal/signal/settings" className="text-primary hover:underline">settings</Link>
      </div>
    </div>
  )
}

function EmptyState({ hasTopics, enabled }: { hasTopics: boolean; enabled: boolean }) {
  if (!hasTopics) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70 mb-4">No topics yet.</p>
        <Link href="/portal/signal/settings" className="font-mono text-xs uppercase tracking-wider text-primary hover:underline">
          Add your first topic &rarr;
        </Link>
      </div>
    )
  }
  if (!enabled) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70 mb-4">Daily digest is off.</p>
        <Link href="/portal/signal/settings" className="font-mono text-xs uppercase tracking-wider text-primary hover:underline">
          Turn it on &rarr;
        </Link>
      </div>
    )
  }
  return (
    <div className="text-center py-12">
      <p className="text-foreground/70">Nothing today. No filler, no fluff.</p>
    </div>
  )
}
