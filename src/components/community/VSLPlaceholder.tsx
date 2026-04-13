import { Play } from "lucide-react"

export function VSLPlaceholder() {
  return (
    <section className="relative py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="relative w-full aspect-video rounded-md border border-line bg-deep/80 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-cream/30 bg-cream/5">
            <Play className="w-7 h-7 sm:w-9 sm:h-9 text-cream/80 ml-1" />
          </div>
          <p className="text-sm sm:text-base font-mono uppercase tracking-wider text-cream/60">
            Watch: How This Works - 3 Minutes
          </p>
        </div>
      </div>
    </section>
  )
}
