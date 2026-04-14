"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

const TYPEFORM_URL = "#apply"

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
          ? "bg-ink/95 backdrop-blur-md border-b border-line"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
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
              <span className="text-[11px] uppercase tracking-[0.2em] text-aims-gold font-mono">
                AI Operator Collective
              </span>
              <span className="text-[9px] text-cream/70 uppercase tracking-wider font-mono">
                Powered by AIMS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-7 text-sm absolute left-1/2 -translate-x-1/2">
            <a href="#program" className="text-cream/70 hover:text-cream transition-colors">
              Program
            </a>
            <a href="#mentors" className="text-cream/70 hover:text-cream transition-colors">
              Mentors
            </a>
            <a href="#faq" className="text-cream/70 hover:text-cream transition-colors">
              FAQ
            </a>
          </nav>

          <a
            href={TYPEFORM_URL}
            className="inline-flex items-center justify-center rounded-sm bg-aims-gold text-ink px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-aims-gold-light transition-colors shadow-[0_0_0_1px_rgba(196,151,42,0.3)]"
          >
            Apply Now
          </a>
        </div>
      </div>
    </header>
  )
}
