import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { TopicEditor } from "@/components/signal/TopicEditor"
import { ChannelPrefs } from "@/components/signal/ChannelPrefs"

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
    <div className="mx-auto max-w-[560px] px-6 py-14">
      <div className="mb-8">
        <Link href="/portal/signal" className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 hover:text-primary">
          &larr; back to signal
        </Link>
        <h1 className="font-serif text-3xl mt-4 text-foreground">Settings</h1>
      </div>

      <section className="mb-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 mb-5">Topics</h2>
        <TopicEditor initial={user.signalTopics} />
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 mb-5">Delivery</h2>
        <ChannelPrefs
          initial={{
            notifSignalDigest: user.notifSignalDigest,
            signalSmsOptIn: user.signalSmsOptIn,
            signalPhoneE164: user.signalPhoneE164,
          }}
          email={user.email}
        />
      </section>

      <div className="mt-16 pt-6 border-t border-border/40 font-mono text-[10px] text-foreground/40">
        digest runs daily at 10:00 UTC &middot; 5 topics max
      </div>
    </div>
  )
}
