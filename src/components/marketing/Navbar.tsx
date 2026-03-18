"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Menu, X, ShoppingCart, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useCart } from "@/components/shared/CartContext"

const TOOLS_LINKS = [
  { label: "AI Readiness Quiz", href: "/tools/ai-readiness-quiz", desc: "See how AI-ready your business is" },
  { label: "ROI Calculator", href: "/tools/roi-calculator", desc: "Project your revenue impact" },
  { label: "Free Website Audit", href: "/tools/website-audit", desc: "Score your site in 60 seconds" },
  { label: "Segment Explorer", href: "/tools/segment-explorer", desc: "Browse 100+ B2B audiences" },
  { label: "Stack Configurator", href: "/tools/stack-configurator", desc: "Build your custom AI stack" },
]

const INDUSTRIES_LINKS = [
  { label: "All Industries", href: "/industries" },
  { label: "Vendingpreneurs", href: "/industries/vendingpreneurs" },
  { label: "Car Dealerships", href: "/industries/car-dealerships" },
  { label: "Small Business", href: "/industries/small-business" },
  { label: "Hotels & Hospitality", href: "/industries/hotels-hospitality" },
  { label: "Enterprise", href: "/industries/enterprise" },
]

const RESOURCES_LINKS = [
  { label: "Blog", href: "/blog", desc: "Playbooks and insights" },
  { label: "Case Studies", href: "/case-studies", desc: "Real results from real clients" },
]

type DropdownKey = "tools" | "industries" | "resources" | null

function DropdownMenu({
  items,
  withDesc,
}: {
  items: { label: string; href: string; desc?: string }[]
  withDesc?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 min-w-[200px]"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-800">{item.label}</span>
          {withDesc && item.desc && (
            <span className="text-xs text-gray-400 mt-0.5">{item.desc}</span>
          )}
        </Link>
      ))}
    </motion.div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState<DropdownKey>(null)
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey>(null)
  const pathname = usePathname()
  const { items, openCart } = useCart()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false); setDropdown(null) }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function toggleDropdown(key: DropdownKey) {
    setDropdown((prev) => (prev === key ? null : key))
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-card/90 backdrop-blur-md border-b border-border/80"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="AIMS" width={28} height={28} className="object-contain" priority />
            <span className="text-[15px] font-bold tracking-tight text-foreground">AIMS</span>
          </Link>

          {/* Desktop nav */}
          <nav ref={dropdownRef} className="hidden md:flex items-center gap-0.5 flex-1 justify-center">

            {/* Services */}
            <Link
              href="/marketplace"
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                pathname === "/marketplace"
                  ? "text-foreground bg-gray-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
              )}
            >
              Services
            </Link>

            {/* Solutions */}
            <Link
              href="/solutions"
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                pathname === "/solutions"
                  ? "text-foreground bg-gray-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
              )}
            >
              Solutions
            </Link>

            {/* Tools dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("tools")}
                className={cn(
                  "flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  dropdown === "tools"
                    ? "text-foreground bg-gray-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
                )}
              >
                Free Tools
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", dropdown === "tools" ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {dropdown === "tools" && <DropdownMenu items={TOOLS_LINKS} withDesc />}
              </AnimatePresence>
            </div>

            {/* Industries dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("industries")}
                className={cn(
                  "flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  dropdown === "industries"
                    ? "text-foreground bg-gray-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
                )}
              >
                Industries
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", dropdown === "industries" ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {dropdown === "industries" && <DropdownMenu items={INDUSTRIES_LINKS} />}
              </AnimatePresence>
            </div>

            {/* Resources dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("resources")}
                className={cn(
                  "flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  dropdown === "resources"
                    ? "text-foreground bg-gray-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
                )}
              >
                Resources
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", dropdown === "resources" ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {dropdown === "resources" && <DropdownMenu items={RESOURCES_LINKS} withDesc />}
              </AnimatePresence>
            </div>

            <Link
              href="/pricing"
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                pathname === "/pricing"
                  ? "text-foreground bg-gray-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100/70"
              )}
            >
              Pricing
            </Link>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </button>

            <SignedIn>
              <Link href="/portal/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link
                href="/get-started"
                className="text-xs font-bold rounded-lg bg-[#DC2626] text-white px-5 py-2 uppercase tracking-wider hover:bg-[#B91C1C] transition-colors"
              >
                Get started
              </Link>
            </SignedOut>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden overflow-hidden bg-card border-b border-border"
          >
            <div className="px-4 py-4 space-y-1">
              <Link href="/marketplace" className="flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                Services
              </Link>

              <Link href="/solutions" className="flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                Solutions
              </Link>

              {/* Mobile Tools */}
              <div>
                <button
                  onClick={() => setMobileExpanded((p) => p === "tools" ? null : "tools")}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Free Tools
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === "tools" ? "rotate-180" : "")} />
                </button>
                {mobileExpanded === "tools" && (
                  <div className="ml-3 mt-1 space-y-1">
                    {TOOLS_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Industries */}
              <div>
                <button
                  onClick={() => setMobileExpanded((p) => p === "industries" ? null : "industries")}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Industries
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === "industries" ? "rotate-180" : "")} />
                </button>
                {mobileExpanded === "industries" && (
                  <div className="ml-3 mt-1 space-y-1">
                    {INDUSTRIES_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Resources */}
              <div>
                <button
                  onClick={() => setMobileExpanded((p) => p === "resources" ? null : "resources")}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Resources
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === "resources" ? "rotate-180" : "")} />
                </button>
                {mobileExpanded === "resources" && (
                  <div className="ml-3 mt-1 space-y-1">
                    {RESOURCES_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/pricing" className="flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                Pricing
              </Link>

              <div className="pt-3 mt-3 border-t border-border space-y-2">
                <button
                  onClick={() => { openCart(); setMobileOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {items.length > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                      {items.length}
                    </span>
                  )}
                </button>
                <SignedIn>
                  <Link href="/portal/dashboard" className="block px-3 py-2 text-sm font-medium text-muted-foreground">
                    Dashboard
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="block px-3 py-2 text-sm font-medium text-muted-foreground">
                    Sign in
                  </Link>
                </SignedOut>
                <Link
                  href="/get-started"
                  className="block w-full text-center rounded-lg bg-[#DC2626] text-white text-xs font-bold px-4 py-2.5 uppercase tracking-wider"
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
