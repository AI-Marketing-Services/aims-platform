import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter text-[#DC2626]">
        404
      </p>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-2 mb-3">
        Page not found
      </h1>
      <p className="text-gray-500 text-sm sm:text-base max-w-md mb-8">
        The page you are looking for does not exist or has been moved. Check the URL or head back to the homepage.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to homepage
      </Link>
    </div>
  )
}
