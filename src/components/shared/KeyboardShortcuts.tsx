"use client"

import { useEffect, useCallback } from "react"

export function KeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or "/" to focus search input
    if ((e.metaKey && e.key === "k") || (e.key === "/" && !isInputFocused())) {
      e.preventDefault()
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="search"], input[data-search]'
      )
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    }

    // Esc to close modals/expanded sections
    if (e.key === "Escape") {
      const activeElement = document.activeElement as HTMLElement | null
      if (activeElement) {
        activeElement.blur()
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return null
}

function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" || (active as HTMLElement).isContentEditable
}
