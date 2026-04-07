import { Check, X } from "lucide-react"

const ROWS = [
  { feature: "Business fundamentals taught first", us: true, yt: false, skool: false },
  { feature: "Operator-led mentorship (YPO members)", us: true, yt: false, skool: false },
  { feature: "AI deployment in proper sequence", us: "Week 5", yt: "Day 1", skool: "Day 1" },
  { feature: "Live coaching with portfolio operators", us: true, yt: false, skool: "Sometimes" },
  { feature: "Application-only program", us: true, yt: false, skool: false },
  { feature: "Hot-seat deal review sessions", us: true, yt: false, skool: "Sometimes" },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-aims-gold mx-auto" />
  if (value === false) return <X className="w-5 h-5 text-cream/30 mx-auto" />
  return <span className="text-xs font-mono uppercase tracking-wider text-cream/70">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            This Isn&apos;t Another{" "}
            <span className="block text-aims-gold italic">AI Course</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            How the AI Operator Collective compares to free communities and YouTube tutorials.
          </p>
        </div>

        <div className="mt-14 rounded-md border border-line bg-surface/40 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-line text-xs font-mono uppercase tracking-wider text-cream/40">
              Feature
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-line text-center text-xs font-mono uppercase tracking-wider text-aims-gold bg-aims-gold/5">
              The Collective
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-line text-center text-xs font-mono uppercase tracking-wider text-cream/40">
              YouTube / TikTok
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-line text-center text-xs font-mono uppercase tracking-wider text-cream/40">
              Other Skools
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div key={i} className="contents">
                <div
                  className={`p-4 sm:p-5 text-sm text-cream/80 ${
                    i < ROWS.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  {row.feature}
                </div>
                <div
                  className={`p-4 sm:p-5 border-l border-line bg-aims-gold/5 flex items-center justify-center ${
                    i < ROWS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <Cell value={row.us} />
                </div>
                <div
                  className={`p-4 sm:p-5 border-l border-line flex items-center justify-center ${
                    i < ROWS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <Cell value={row.yt} />
                </div>
                <div
                  className={`p-4 sm:p-5 border-l border-line flex items-center justify-center ${
                    i < ROWS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <Cell value={row.skool} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
