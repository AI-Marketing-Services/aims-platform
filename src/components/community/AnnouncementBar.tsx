import { Calendar, Users } from "lucide-react"

export function AnnouncementBar() {
  return (
    <div className="w-full bg-black/60 border-b border-line text-cream/80 text-xs">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-aims-gold" />
          Next Cohort Opens Q2 2026
        </span>
        <span className="hidden sm:inline text-cream/50">|</span>
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-aims-gold" />
          Founding Members: Limited to 100 Operators
        </span>
      </div>
    </div>
  )
}
