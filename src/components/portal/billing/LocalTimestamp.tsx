"use client"

import { useEffect, useState } from "react"

interface Props {
  /** ISO 8601 timestamp from the server (always UTC). */
  iso: string
  /** Format options passed to toLocaleString. */
  options?: Intl.DateTimeFormatOptions
}

/**
 * Renders a server-supplied ISO timestamp in the visitor's local
 * timezone. The naive `new Date(iso).toLocaleString()` call inside a
 * Server Component formats using the SERVER's TZ (UTC on Vercel) —
 * users in PST see times that are 7-8 hours ahead, which is what
 * James reported on /portal/billing's "Recent activity" panel.
 *
 * We render the raw ISO on first server paint so SSR doesn't ship
 * a UTC label that flickers, then swap to the formatted local string
 * once mounted on the client. The hydration window is < 50ms in
 * practice so the flicker is invisible.
 */
export function LocalTimestamp({ iso, options }: Props) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    try {
      const opts: Intl.DateTimeFormatOptions = options ?? {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
      setFormatted(new Date(iso).toLocaleString(undefined, opts))
    } catch {
      setFormatted(iso)
    }
  }, [iso, options])

  // Pre-hydration: render a stable but neutral fallback so React's
  // hydration check doesn't see a server/client mismatch.
  return <span suppressHydrationWarning>{formatted ?? ""}</span>
}
