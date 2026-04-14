import Image from "next/image"
import Link from "next/link"

export function CommunityFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/10 bg-[#383838] text-white texture-dark dot-grid-dark">
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-crimson-light font-mono">
                AI Operator Collective
              </span>
              <span className="text-[9px] text-white/50 uppercase tracking-wider font-mono">
                Powered by AIMS
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-5 text-xs font-mono uppercase tracking-wider text-white/60">
            <a href="#program" className="hover:text-white transition-colors">
              Program
            </a>
            <a href="#mentors" className="hover:text-white transition-colors">
              Mentors
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <a href="#disclosures" className="hover:text-white transition-colors">
              Disclosures
            </a>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-[11px] font-mono uppercase tracking-wider text-white/40">
          &copy; {year} Modern Amenities LLC. All rights reserved.
          <span className="mx-2 text-white/30">|</span>
          aioperatorcollective.com
        </div>
      </div>
    </footer>
  )
}
