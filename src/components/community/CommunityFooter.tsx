import Image from "next/image"
import Link from "next/link"

export function CommunityFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[#E3E3E3] bg-[#F5F5F5] texture-light">
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="AI Operator Collective"
              width={40}
              height={40}
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
          </div>

          <nav className="flex items-center gap-5 text-xs font-mono uppercase tracking-wider text-[#737373]">
            <Link href="/#program" className="hover:text-[#1A1A1A] transition-colors">
              Program
            </Link>
            <Link href="/#mentors" className="hover:text-[#1A1A1A] transition-colors">
              Mentors
            </Link>
            <Link href="/#faq" className="hover:text-[#1A1A1A] transition-colors">
              FAQ
            </Link>
            <Link href="/#disclosures" className="hover:text-[#1A1A1A] transition-colors">
              Disclosures
            </Link>
            <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#1A1A1A] transition-colors">
              Terms
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E3E3E3] text-center text-[11px] font-mono uppercase tracking-wider text-[#737373]/60">
          &copy; {year} Modern Amenities LLC. All rights reserved.
          <span className="mx-2 text-[#ccc]">|</span>
          aioperatorcollective.com
        </div>
      </div>
    </footer>
  )
}
