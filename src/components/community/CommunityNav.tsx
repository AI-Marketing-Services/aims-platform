"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

const APPLY_URL = "/apply"

export function CommunityNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-40 transition-all duration-200",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E3E3E3] shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="relative flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="AI Operator Collective"
              width={48}
              height={48}
              className="object-contain h-10 w-10"
              priority
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.2em] text-crimson font-mono">
                AI Operator Collective
              </span>
              <span className="text-[9px] text-[#737373] uppercase tracking-wider font-mono">
                Powered by AIMS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-7 text-sm absolute left-1/2 -translate-x-1/2">
            <Link href="/#program" className="text-[#737373] hover:text-[#1A1A1A] transition-colors">
              Program
            </Link>
            <Link href="/#mentors" className="text-[#737373] hover:text-[#1A1A1A] transition-colors">
              Mentors
            </Link>
            <Link href="/#faq" className="text-[#737373] hover:text-[#1A1A1A] transition-colors">
              FAQ
            </Link>
          </nav>

          <a
            href={APPLY_URL}
            className="inline-flex items-center justify-center rounded-md bg-crimson text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-crimson-dark transition-colors shadow-[0_0_0_1px_rgba(153,27,27,0.3)]"
          >
            Apply Now
          </a>
        </div>
      </div>
    </header>
  )
}
