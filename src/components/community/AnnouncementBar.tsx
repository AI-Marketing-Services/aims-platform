import { Calendar, Users } from "lucide-react"

export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#383838] border-b border-white/10 text-white/80 text-xs">
      <div className="mx-auto max-w-[1280px] px-6 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-crimson-light" />
          Next Cohort Opens Q2 2026
        </span>
        <span className="hidden sm:inline text-white/50">|</span>
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-crimson-light" />
          Founding Members: Limited to 100 Operators
        </span>
      </div>
    </div>
  )
}
