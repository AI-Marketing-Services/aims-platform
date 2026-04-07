import Image from "next/image"
import Link from "next/link"

export function CommunityFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-12">
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-aims-gold font-mono">
                AI Operator Collective
              </span>
              <span className="text-[9px] text-cream/40 uppercase tracking-wider font-mono">
                Powered by AIMS
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-cream/50">
            <a href="#program" className="hover:text-cream transition-colors">
              Program
            </a>
            <a href="#mentors" className="hover:text-cream transition-colors">
              Mentors
            </a>
            <a href="#faq" className="hover:text-cream transition-colors">
              FAQ
            </a>
            <Link href="/privacy" className="hover:text-cream transition-colors">
              Privacy
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-line text-center text-[11px] font-mono uppercase tracking-wider text-cream/30">
          &copy; {year} Modern Amenities LLC. All rights reserved.
          <span className="mx-2 text-cream/20">|</span>
          aioperatorcollective.com
        </div>
      </div>
    </footer>
  )
}
