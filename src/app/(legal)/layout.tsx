import Image from "next/image"
import Link from "next/link"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-[#1A1A1A]">
      <header className="border-b border-[#E3E3E3] bg-[#FAFAF7]">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="AI Operator Collective"
              width={36}
              height={36}
              className="object-contain h-9 w-9"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-[0.2em] text-crimson font-mono">
                AI Operator Collective
              </span>
              <span className="text-[9px] text-[#737373] uppercase tracking-wider font-mono">
                Powered by AIMS
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16">{children}</div>
      </main>

      <footer className="border-t border-[#E3E3E3] bg-[#FAFAF7]">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-[11px] font-mono uppercase tracking-wider text-[#737373]">
          &copy; {year} Modern Amenities LLC
          <span className="mx-2 text-[#ccc]">&middot;</span>
          aioperatorcollective.com
        </div>
      </footer>
    </div>
  )
}
