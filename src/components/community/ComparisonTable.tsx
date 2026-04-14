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
  if (value === true) return <Check className="w-5 h-5 text-crimson mx-auto" />
  if (value === false) return <X className="w-5 h-5 text-[#737373]/60 mx-auto" />
  return <span className="text-xs font-mono uppercase tracking-wider text-[#737373]">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="relative py-20 sm:py-24 border-t border-[#E3E3E3]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl sm:text-4xl text-[#1A1A1A] leading-[1.25] pb-2">
            The difference is sequencing{" "}
            <span className="text-crimson italic">and skin in the game.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#737373] leading-relaxed max-w-2xl mx-auto">
            Every other community gives you n8n workflows and prompt packs. That&apos;s a
            folder of automations, not a business. We sequence it correctly: business
            fundamentals first (weeks 1-4), AI tooling second (week 5+). Because tools
            without a business are just expensive hobbies.
          </p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto rounded-md border border-[#E3E3E3] overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3E3E3] bg-[#F5F5F5] text-xs font-mono uppercase tracking-wider text-[#737373]">
              What You Need
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-[#E3E3E3] bg-[#F5F5F5] text-center text-xs font-mono uppercase tracking-wider text-[#737373]">
              YouTube / Skool
            </div>
            <div className="p-4 sm:p-5 border-b border-l border-[#E3E3E3] bg-crimson/5 text-center text-xs font-mono uppercase tracking-wider text-crimson">
              The Collective
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => {
              const isLast = i === ROWS.length - 1
              return (
                <div key={i} className="contents">
                  <div
                    className={cn(
                      "p-4 sm:p-5 text-sm text-[#383838]",
                      !isLast && "border-b border-[#E3E3E3]",
                      row.highlight && "bg-crimson/5 text-[#1A1A1A] font-medium"
                    )}
                  >
                    {row.feature}
                  </div>
                  <div
                    className={cn(
                      "p-4 sm:p-5 border-l border-[#E3E3E3] flex items-center justify-center",
                      !isLast && "border-b border-[#E3E3E3]",
                      row.highlight && "bg-crimson/5"
                    )}
                  >
                    <Cell value={row.yt} />
                  </div>
                  <div
                    className={cn(
                      "p-4 sm:p-5 border-l border-[#E3E3E3] bg-crimson/5 flex items-center justify-center",
                      !isLast && "border-b border-[#E3E3E3]",
                      row.highlight && "bg-crimson/10"
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
