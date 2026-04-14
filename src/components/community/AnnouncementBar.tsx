import { Calendar, Users } from "lucide-react"

export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#F5F5F5] border-b border-[#E3E3E3] text-[#737373] text-xs">
      <div className="mx-auto max-w-[1280px] px-6 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-crimson" />
          Next Cohort Opens Q2 2026
        </span>
        <span className="hidden sm:inline text-[#ccc]">|</span>
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-crimson" />
          First Cohort: Limited to 10 Members
        </span>
      </div>
    </div>
  )
}
