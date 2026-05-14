"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, ArrowRight } from "lucide-react"

/**
 * Top-of-portal banner shown to users who haven't completed (or
 * explicitly skipped) the first-run welcome wizard. Self-hides on the
 * /portal/welcome route itself so it doesn't follow them into the
 * wizard. Client component (not server-rendered conditional) because
 * we need usePathname to do the self-hide cleanly without re-running
 * the layout query.
 */
export function WelcomeWizardBanner() {
  const path = usePathname()
  if (path?.startsWith("/portal/welcome")) return null
  return (
    <Link
      href="/portal/welcome"
      className="block bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Finish setting up your account</span>
          <span className="text-primary-foreground/80 hidden sm:inline">
            · Brand your portal, scout your first 5 leads, get a real
            dashboard
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
          Start the tour <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
