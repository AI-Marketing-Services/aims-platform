import type { Metadata } from "next"

// Public quiz pages are unauthenticated, lightweight, brand-themed to the
// operator. They sit OUTSIDE the (portal)/(admin)/(marketing) groups so none
// of those chrome layouts apply — only the root layout (ClerkProvider) wraps
// these. Keep this file intentionally thin.

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-white text-neutral-900 antialiased">{children}</div>
}
