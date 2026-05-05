"use client"

import { useState } from "react"
import { Rocket, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  roadmapSection: React.ReactNode
  profileSection: React.ReactNode
  completedCount: number
  totalSteps: number
  percent: number
}

export function OnboardTabs({ roadmapSection, profileSection, completedCount, totalSteps, percent }: Props) {
  const [tab, setTab] = useState<"roadmap" | "profile">("roadmap")

  return (
    <div className="w-full space-y-6">
      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setTab("roadmap")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "roadmap"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Rocket className="h-4 w-4" />
          30-Day Roadmap
          {percent > 0 && percent < 100 && (
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
              {completedCount}/{totalSteps}
            </span>
          )}
          {percent === 100 && (
            <span className="ml-1 text-xs bg-primary/50/10 text-primary px-1.5 py-0.5 rounded-full">
              Done
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCircle className="h-4 w-4" />
          Business Profile
        </button>
      </div>

      {/* Tab content */}
      <div className={cn(tab === "roadmap" ? "block" : "hidden")}>
        {roadmapSection}
      </div>
      <div className={cn(tab === "profile" ? "block" : "hidden")}>
        {profileSection}
      </div>
    </div>
  )
}
