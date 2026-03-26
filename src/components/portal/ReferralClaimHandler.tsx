"use client"

import { useEffect } from "react"

/**
 * ReferralClaimHandler
 *
 * On mount, checks for an `aims_ref` cookie (set by partner landing pages or referral links).
 * If found, calls /api/referrals/claim to link the current user as the referred user
 * on the Referral record. This enables commission tracking on invoice.paid.
 *
 * After claiming (or if no cookie), clears the cookie to prevent duplicate calls.
 */
export function ReferralClaimHandler() {
  useEffect(() => {
    const refCode = getCookie("aims_ref")
    if (!refCode) return

    // Clear the cookie immediately to prevent duplicate calls on re-renders
    clearCookie("aims_ref")

    fetch("/api/referrals/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: refCode }),
    }).catch(() => {
      // Silently fail - this is a best-effort operation
    })
  }, [])

  return null
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`
}
