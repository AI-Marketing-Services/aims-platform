"use client"

import { ChevronDown } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  /** Stable key used for localStorage persistence. */
  storageKey: string
  /** Section label displayed in the header. */
  label: string
  /** Initial collapsed state — overridden by localStorage if present. */
  defaultCollapsed?: boolean
  /** When true, hide the label entirely (compact sidebar). The chevron
   *  also hides — only the divider line remains as a separator. */
  hideLabel?: boolean
  /** Optional small badge rendered next to the label (e.g. unread count). */
  badge?: React.ReactNode
  children: React.ReactNode
}

/**
 * Collapsible sidebar section. Reusable across AdminSidebar +
 * PortalSidebar. Persists the open/closed state per `storageKey` so a
 * user who collapses "Operations" stays collapsed across page loads.
 *
 * Tradeoff: starts in `defaultCollapsed` state on first render to avoid
 * a hydration mismatch (localStorage isn't available on the server).
 * The persisted preference applies on the next paint via useEffect.
 * That's a subtle one-frame flicker; in practice it isn't noticeable
 * because the hydration scheduler fires before the user can perceive
 * the difference.
 */
export function CollapsibleNavSection({
  storageKey,
  label,
  defaultCollapsed = false,
  hideLabel = false,
  badge,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  // Hydrate from localStorage after mount.
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw === "1") setCollapsed(true)
      else if (raw === "0") setCollapsed(false)
    } catch {
      // Private mode / disabled storage — fall back to default.
    }
  }, [storageKey])

  // Persist on change.
  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0")
      } catch {
        // Non-fatal.
      }
      return next
    })
  }

  // Compact mode: no header, no animation — just render children inline.
  // Sections still serve as visual groupings via the divider above.
  if (hideLabel) {
    return <div className="mb-3">{children}</div>
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2 px-4 py-1 group"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </p>
        {badge}
        <div className="flex-1 h-px bg-surface group-hover:bg-border transition-colors" />
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted-foreground group-hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.15 },
            }}
            className={cn("overflow-hidden")}
          >
            <div className="pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
