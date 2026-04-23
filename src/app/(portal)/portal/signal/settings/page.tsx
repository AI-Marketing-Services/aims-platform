import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { TopicEditor } from "@/components/signal/TopicEditor"
import { ChannelPrefs } from "@/components/signal/ChannelPrefs"
import { ArrowLeft, Rss } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Signal Settings · AIMS", robots: { index: false } }

export default async function SignalSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      email: true,
      notifSignalDigest: true,
      signalSmsOptIn: true,
      signalPhoneE164: true,
      signalTopics: {
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, query: true, enabled: true },
      },
    },
  })
  if (!user) redirect("/sign-in")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/portal/signal"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Signal
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rss className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Signal Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your daily AI industry briefing</p>
        </div>
      </div>

      {/* Topics */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Topics</h2>
          <p className="text-xs text-muted-foreground">
            Signal tracks up to 5 topics. Each morning it surfaces the top news for each. Pick what matters to your business.
          </p>
        </div>
        <TopicEditor initial={user.signalTopics} />
      </div>

      {/* Delivery */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Delivery</h2>
          <p className="text-xs text-muted-foreground">Choose how you receive your daily digest.</p>
        </div>
        <ChannelPrefs
          initial={{
            notifSignalDigest: user.notifSignalDigest,
            signalSmsOptIn: user.signalSmsOptIn,
            signalPhoneE164: user.signalPhoneE164,
          }}
          email={user.email}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Digest runs daily at 10:00 UTC · 5 topics max
      </p>
    </div>
  )
}
