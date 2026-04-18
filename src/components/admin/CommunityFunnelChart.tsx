import { Sparkles, Calendar, MessageSquare, UserPlus, CheckCircle2 } from "lucide-react"

const STAGES = [
  {
    key: "APPLICATION_SUBMITTED",
    label: "Applied",
    description: "Submitted the Collective application",
    icon: Sparkles,
  },
  {
    key: "CONSULT_BOOKED",
    label: "Consult Booked",
    description: "Scheduled the Calendly call",
    icon: Calendar,
  },
  {
    key: "CONSULT_COMPLETED",
    label: "Consult Done",
    description: "Took the call, awaiting invite",
    icon: MessageSquare,
  },
  {
    key: "MIGHTY_INVITED",
    label: "Invited",
    description: "Branded invite email sent",
    icon: UserPlus,
  },
  {
    key: "MEMBER_JOINED",
    label: "Joined",
    description: "Accepted + inside the community",
    icon: CheckCircle2,
  },
] as const

/**
 * Vertical community funnel. Each stage = one horizontal row with count,
 * icon, and a crimson-ramped bar proportional to the largest stage.
 * Reads like a progress ladder instead of a dashboard chart.
 */
export function CommunityFunnelChart({
  counts,
}: {
  counts: Record<string, number>
}) {
  const max = Math.max(1, ...STAGES.map((s) => counts[s.key] ?? 0))

  return (
    <div className="space-y-2">
      {STAGES.map((stage, idx) => {
        const count = counts[stage.key] ?? 0
        const pct = (count / max) * 100
        const Icon = stage.icon
        const isWin = stage.key === "MEMBER_JOINED"
        return (
          <div key={stage.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 w-24 sm:w-40 flex-shrink-0">
              <Icon
                className={`h-3.5 w-3.5 flex-shrink-0 ${
                  isWin ? "text-emerald-600" : "text-primary"
                }`}
              />
              <span className="text-[11px] sm:text-xs font-medium text-foreground truncate">
                {stage.label}
              </span>
            </div>
            <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
              <div
                className={`h-full ${
                  isWin ? "bg-emerald-100" : "bg-primary/10"
                } transition-all duration-500`}
                style={{
                  width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                  // Progressive crimson ramp so later stages look earned.
                  opacity: isWin ? 1 : 0.5 + idx * 0.12,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className="text-[11px] text-muted-foreground font-mono">
                  {stage.description}
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    isWin ? "text-emerald-700" : "text-foreground"
                  }`}
                >
                  {count}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
