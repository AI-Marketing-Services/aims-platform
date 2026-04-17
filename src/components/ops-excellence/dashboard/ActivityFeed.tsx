"use client"

import { useState } from "react"
import {
  TrendingUp,
  Zap,
  Scissors,
  ArrowRight,
  FileText,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Inbox,
  type LucideIcon,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn, timeAgo } from "@/lib/utils"
import type { ActivityItem } from "@/lib/ops-excellence/types"

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const MAX_VISIBLE = 15

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  SCORE_CALCULATED: {
    icon: TrendingUp,
    color: "text-[#981B1B]",
    bg: "bg-primary/10",
  },
  AUTOMATION_DEPLOYED: {
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
  AUTOMATION_CREATED: {
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
  SPEND_DECISION_CREATED: {
    icon: Scissors,
    color: "text-orange-400",
    bg: "bg-orange-900/20",
  },
  SPEND_DECISION_STATUS_CHANGED: {
    icon: Scissors,
    color: "text-orange-400",
    bg: "bg-orange-900/20",
  },
  STAGE_CHANGED: {
    icon: ArrowRight,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
  },
  TIER_CHANGED: {
    icon: ArrowRight,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
  },
  DISCOVERY_CARD_CREATED: {
    icon: ClipboardList,
    color: "text-purple-400",
    bg: "bg-purple-900/20",
  },
  CFO_TEST_UPDATED: {
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-900/20",
  },
  CFO_TEST_COMPLETED: {
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-900/20",
  },
  AUTOMATION_CARD_CREATED: {
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
  PULSE_SURVEY_SUBMITTED: {
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
  },
  INTAKE_SUBMITTED: {
    icon: RefreshCw,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
  AUTOMATION_METRICS_UPDATED: {
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
}

const DEFAULT_ICON_CONFIG = {
  icon: FileText,
  color: "text-muted-foreground",
  bg: "bg-deep",
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const [showAll, setShowAll] = useState(false)

  const visibleActivities = showAll ? activities : activities.slice(0, MAX_VISIBLE)
  const hasMore = activities.length > MAX_VISIBLE

  if (activities.length === 0) {
    return (
      <motion.div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Activity
          </h3>
        </div>
        <div className="px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep mx-auto mb-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Activity will appear here as your engagement progresses
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Activity
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recent events and milestones
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

          <ul className="space-y-0">
            {visibleActivities.map((activity, i) => {
              const iconConfig = TYPE_ICONS[activity.type] ?? DEFAULT_ICON_CONFIG
              const Icon = iconConfig.icon

              return (
                <motion.li
                  key={activity.id}
                  className="relative flex gap-4 py-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 1.1 + i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      iconConfig.bg
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", iconConfig.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {activity.title}
                    </p>
                    {activity.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {activity.detail}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-xs text-muted-foreground font-mono pt-0.5">
                    {timeAgo(activity.createdAt)}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* View all toggle */}
      {hasMore && !showAll && (
        <div className="px-6 pb-4">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all {activities.length} events
          </button>
        </div>
      )}
    </motion.div>
  )
}
