import Link from "next/link"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Unsubscribe · Daily Signal",
  robots: { index: false },
}

export default async function SignalUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token: rawToken } = await searchParams
  const token = rawToken?.trim()
  let state: "missing" | "notfound" | "done" = "missing"
  let email: string | null = null

  if (token) {
    const sub = await db.signalSubscriber.findUnique({ where: { unsubToken: token } })
    if (!sub) {
      state = "notfound"
    } else {
      if (sub.status !== "UNSUBSCRIBED") {
        await db.signalSubscriber.update({
          where: { id: sub.id },
          data: { status: "UNSUBSCRIBED" },
        })
      }
      state = "done"
      email = sub.email
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[520px] px-6 py-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-3">
          DAILY SIGNAL
        </div>
        {state === "done" && (
          <>
            <h1 className="font-serif text-4xl text-foreground mb-4">Unsubscribed.</h1>
            <p className="text-foreground/70">
              {email ? <>No more Signals to <span className="font-mono">{email}</span>.</> : <>No more Signals.</>}
              {" "}
              Changed your mind? Just re-subscribe and your topics come back.
            </p>
            <div className="mt-10">
              <Link
                href="/tools/daily-signal"
                className="inline-flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider hover:underline"
              >
                re-subscribe &rarr;
              </Link>
            </div>
          </>
        )}
        {state === "notfound" && (
          <>
            <h1 className="font-serif text-4xl text-foreground mb-4">Link expired.</h1>
            <p className="text-foreground/70">
              We couldn&apos;t find that subscription. It may already be unsubscribed — or the
              link was mangled in transit.
            </p>
          </>
        )}
        {state === "missing" && (
          <>
            <h1 className="font-serif text-4xl text-foreground mb-4">Missing token.</h1>
            <p className="text-foreground/70">
              Use the unsubscribe link from the bottom of any Signal email.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
