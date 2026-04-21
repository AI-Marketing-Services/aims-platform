import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "You're in · Daily Signal",
  description: "Your first Signal is on its way. One email, 6am ET, every morning.",
  robots: { index: false },
}

export default async function DailySignalConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ topics?: string }>
}) {
  const { topics } = await searchParams
  const topicCount = Number(topics ?? 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[560px] px-6 py-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-4">
          YOU&apos;RE IN
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-4">
          Your first Signal is coming.
        </h1>
        <p className="text-foreground/70 text-lg leading-relaxed mb-10">
          {topicCount > 0
            ? `We'll start scanning your ${topicCount} topic${topicCount === 1 ? "" : "s"} now. The first digest lands in your inbox within a few minutes, then daily at 6am ET.`
            : "The first digest lands in your inbox within a few minutes, then daily at 6am ET."}
        </p>

        <div className="border-t border-border/30 pt-10 space-y-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-2">
              What to expect
            </div>
            <ul className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <li>
                <span className="text-primary font-mono text-[10px] mr-2">01</span>
                One card per topic. One link. One sentence.
              </li>
              <li>
                <span className="text-primary font-mono text-[10px] mr-2">02</span>
                If nothing meaningful happened, we send nothing.
              </li>
              <li>
                <span className="text-primary font-mono text-[10px] mr-2">03</span>
                Unsubscribe in one click. Edit topics anytime.
              </li>
            </ul>
          </div>

          <div className="border-t border-border/30 pt-6">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
            >
              Explore more free tools &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
