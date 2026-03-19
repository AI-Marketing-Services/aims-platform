import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <Search className="h-10 w-10 text-[#DC2626]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-[#DC2626]">404</h1>
          <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
