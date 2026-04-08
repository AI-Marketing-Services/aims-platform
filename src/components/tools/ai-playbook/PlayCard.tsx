import { ArrowRight, Wrench, Lightbulb } from "lucide-react"
import Link from "next/link"
import type { Play } from "@/lib/content/w2-playbook-plays"

interface Props {
  play: Play
  applyUrl: string
}

export function PlayCard({ play, applyUrl }: Props) {
  return (
    <article className="relative rounded-md border border-border bg-card p-6 sm:p-8 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-md bg-primary/15 border border-primary/30">
          <span className="text-base font-bold text-primary font-mono">{play.number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">
            {play.category === "build-a-business" ? "Build Your Own" : "Transform From Within"}
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight">
            {play.title}
          </h3>
        </div>
      </div>

      <p className="text-base text-muted-foreground leading-relaxed mb-6">{play.hook}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary">
              The Steps
            </p>
          </div>
          <ol className="space-y-2.5">
            {play.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="flex-shrink-0 text-xs font-mono text-primary mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary">
              Tools To Use
            </p>
          </div>
          <ul className="flex flex-wrap gap-1.5 mb-5">
            {play.toolsToUse.map((tool) => (
              <li
                key={tool}
                className="inline-flex items-center px-2.5 py-1 rounded-sm border border-border bg-deep text-xs text-muted-foreground"
              >
                {tool}
              </li>
            ))}
          </ul>

          <div className="bg-deep border border-border rounded-md p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">
              Real Example
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {play.realWorldExample}
            </p>
          </div>
        </div>
      </div>

      {/* Inline CTA back to the Collective */}
      <div className="border-t border-border pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground italic">{play.ctaLine}</p>
        <Link
          href={applyUrl}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:text-primary/80 whitespace-nowrap"
        >
          See how it runs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  )
}
