import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const ROWS: { feature: string; yt: string | boolean; us: string | boolean; highlight?: boolean }[] = [
  { feature: "Business fundamentals before AI tools", yt: false, us: true },
  { feature: "Done-for-you LLC and contracts", yt: false, us: true },
  { feature: "Live operator mentorship (YPO members)", yt: false, us: true },
  { feature: "Hot-seat deal reviews", yt: "Sometimes", us: "Every week" },
  { feature: "Operator joins your sales call", yt: false, us: true },
  { feature: "AI tooling in the right order", yt: "Day 1 dump", us: "Week 5 - after you have a business", highlight: true },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-aims-gold mx-auto" />
  if (value === false) return <X className="w-5 h-5 text-cream/40 mx-auto" />
  return <span className="text-xs font-mono uppercase tracking-wider text-cream/60">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="relative py-20 sm:py-24 border-t border-line/50">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-cream/80 leading-[1.25] pb-2">
            The difference is sequencing{" "}
            <span className="text-aims-gold/70 italic">and skin in the game.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-cream/50 leading-relaxed max-w-2xl mx-auto">
            Every other community gives you n8n workflows and prompt packs. That&apos;s a
            folder of automations, not a business. We sequence it correctly: business
            fundamentals first (weeks 1-4), AI tooling second (week 5+). Because tools
            without a business are just expensive hobbies.
          </p>
        </div>

        <div className="mt-12 rounded-md border border-line/60 bg-surface/30 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-line/50 text-xs font-mono uppercase tracking-wider text-cream/50">
              What You Need
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-line/50 text-center text-xs font-mono uppercase tracking-wider text-cream/50">
              YouTube / Skool
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-line/50 text-center text-xs font-mono uppercase tracking-wider text-aims-gold/70 bg-aims-gold/5">
              The Collective
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => {
              const isLast = i === ROWS.length - 1
              return (
                <div key={i} className="contents">
                  <div
                    className={cn(
                      "p-4 sm:p-5 text-sm text-cream/60",
                      !isLast && "border-b border-line/40",
                      row.highlight && "bg-aims-gold/5 text-cream/80 font-medium"
                    )}
                  >
                    {row.feature}
                  </div>
                  <div
                    className={cn(
                      "p-4 sm:p-5 border-l border-line/40 flex items-center justify-center",
                      !isLast && "border-b border-line/40",
                      row.highlight && "bg-aims-gold/5"
                    )}
                  >
                    <Cell value={row.yt} />
                  </div>
                  <div
                    className={cn(
                      "p-4 sm:p-5 border-l border-line/40 bg-aims-gold/5 flex items-center justify-center",
                      !isLast && "border-b border-line/40",
                      row.highlight && "bg-aims-gold/10"
                    )}
                  >
                    <Cell value={row.us} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
