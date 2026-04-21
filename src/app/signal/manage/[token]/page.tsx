import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import SubscriberTopicEditor from "./SubscriberTopicEditor"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Manage your Signal",
  robots: { index: false },
}

export default async function SignalManagePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const sub = await db.signalSubscriber.findUnique({
    where: { unsubToken: token },
    select: { id: true, email: true, status: true, topics: true, unsubToken: true },
  })
  if (!sub) notFound()

  const topics = Array.isArray(sub.topics)
    ? (sub.topics as unknown as Array<{ label: string; query: string }>)
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[560px] px-6 py-16">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-3">
          MANAGE · SIGNAL
        </div>
        <h1 className="font-serif text-4xl text-foreground mb-2">Your topics</h1>
        <p className="text-foreground/60 text-sm mb-10 font-mono">
          {sub.email} &middot; {sub.status === "ACTIVE" ? "active" : sub.status.toLowerCase()}
        </p>

        {sub.status !== "ACTIVE" && (
          <div className="mb-8 p-4 border border-border/40 rounded-[2px]">
            <p className="text-sm text-foreground/70 mb-2">
              You&apos;re currently unsubscribed. Updating topics below will reactivate your
              subscription.
            </p>
          </div>
        )}

        <SubscriberTopicEditor token={token} initialTopics={topics} />

        <div className="mt-14 pt-6 border-t border-border/30 font-mono text-[10px] text-foreground/40 flex justify-between">
          <Link href={`/signal/unsubscribe?token=${encodeURIComponent(sub.unsubToken)}`} className="text-primary hover:underline">
            unsubscribe
          </Link>
          <Link href="/tools" className="text-primary hover:underline">
            all tools &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
