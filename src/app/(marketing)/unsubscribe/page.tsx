import { Suspense } from "react"
import type { Metadata } from "next"
import UnsubscribeClient from "./UnsubscribeClient"

export const metadata: Metadata = {
  title: "Unsubscribe | AIMS",
  description: "Unsubscribe from AIMS marketing emails.",
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <section className="py-24 min-h-[60vh] flex items-center">
        <div className="container mx-auto max-w-md px-4">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </section>
    }>
      <UnsubscribeClient />
    </Suspense>
  )
}
