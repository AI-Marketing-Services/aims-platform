"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, X } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  RESELLER: "Reseller",
  INTERN: "Intern",
}

export function AdminPreviewBanner({ viewingAs }: { viewingAs: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function exitPreview() {
    setLoading(true)
    try {
      await fetch("/api/admin/view-as", { method: "DELETE" })
      router.push("/admin/dashboard")
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-2.5 bg-primary text-white text-xs font-medium">
      <div className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>Admin Preview — viewing as {ROLE_LABELS[viewingAs] ?? viewingAs}</span>
      </div>
      <button
        onClick={exitPreview}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-60 shrink-0"
      >
        <X className="h-3 w-3" />
        {loading ? "Exiting…" : "Exit Preview"}
      </button>
    </div>
  )
}
