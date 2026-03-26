import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Page Not Found | AIMS",
  description: "The page you are looking for does not exist or has been moved.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl font-black text-primary">404</h1>
          <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
