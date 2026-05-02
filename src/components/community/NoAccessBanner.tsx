"use client"

import { useSearchParams } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

export function NoAccessBanner() {
  const params = useSearchParams()
  const { signOut } = useClerk()

  if (params.get("no_access") !== "1") return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <p className="text-sm text-amber-800 text-center sm:text-left">
          <strong>Access restricted.</strong> Your account does not have portal access yet.
          {" "}Contact support or sign out and use an authorized account.
        </p>
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
