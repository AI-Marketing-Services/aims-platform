"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Search, ArrowRight } from "lucide-react"
import { NAV_ITEMS, FLOAT_LOGOS } from "./HeroData"
import { VIEW_MAP, DashboardView } from "./HeroViews"

export function Hero() {
  const [activeView, setActiveView] = useState("dashboard")
  const ActiveView = VIEW_MAP[activeView] ?? DashboardView

  return (
    <section className="relative overflow-hidden bg-deep pt-24 pb-16 md:pt-32 md:pb-24">

      {/* Floating tool logos */}
      {FLOAT_LOGOS.map((logo) => (
        <motion.div
          key={logo.label}
          className="absolute z-10 hidden lg:flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-surface shadow-lg shadow-black/30 border border-border"
          style={logo.style as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -12, 0],
            rotate: [0, 6 * logo.tiltDir, 0, -6 * logo.tiltDir, 0],
          }}
          transition={{
            opacity: { delay: logo.delay + 0.4, duration: 0.4 },
            scale: { delay: logo.delay + 0.4, duration: 0.4 },
            y: { delay: logo.delay + 1, duration: 3 + logo.delay, repeat: Infinity, ease: "easeInOut" },
            rotate: { delay: logo.delay + 1, duration: 4 + logo.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Image src={logo.src} alt={logo.label} width={52} height={52} className="object-contain" />
        </motion.div>
      ))}

      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center text-center">

          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
            <span className="font-mono text-primary text-xs uppercase tracking-widest">AI Managing Services - AIMS</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="font-serif max-w-4xl text-[2.75rem] font-light leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-[3.6rem]"
          >
            Your Business Isn&apos;t Capped On <em className="text-primary">Talent</em>.
            <br />
            It&apos;s Capped On <em className="text-primary">Bandwidth</em>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            We embed inside your organization, find where your best people are buried in low-value work, and install the AI systems that give them - and your business - room to grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <button onClick={() => window.dispatchEvent(new Event("open-intake-chat"))} className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-primary/20 transition hover:bg-primary/80 hover:shadow-lg">
              Speak with Our Intake Agent
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/marketplace" className="inline-flex items-center gap-2 border border-border px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-foreground transition hover:border-primary/50 hover:text-primary">
              Explore Our Engagements
            </Link>
          </motion.div>

          {/* Interactive Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-14 w-full max-w-5xl"
          >
            <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card h-auto sm:h-[560px] shadow-[0_8px_60px_-12px_rgba(196,151,42,0.25),0_0_0_1px_rgba(196,151,42,0.08)] hover:shadow-[0_12px_70px_-10px_rgba(196,151,42,0.35),0_0_0_1px_rgba(196,151,42,0.15)] transition-shadow duration-500">
              <div className="flex flex-col sm:flex-row h-auto sm:h-[560px]">

                {/* DESKTOP SIDEBAR - hidden on mobile */}
                <div className="hidden sm:flex w-40 flex-shrink-0 border-r border-border bg-card flex-col">
                  <div className="flex items-center gap-1.5 px-3 py-3.5 border-b border-border">
                    <Image src="/logo.png" alt="AIMS" width={24} height={24} className="object-contain h-6 w-6" />
                    <span className="text-sm font-serif tracking-tight text-cream">AIMS</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-deep px-2 py-1.5">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Search</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
                    {NAV_ITEMS.map((item, i) => (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${activeView === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.6 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <item.icon className="h-3 w-3 flex-shrink-0" />
                        {item.label}
                      </motion.button>
                    ))}
                  </nav>
                  <div className="border-t border-border px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white">SA</div>
                      <div>
                        <p className="text-[10px] font-semibold text-foreground leading-none">Sam Altman</p>
                        <p className="text-[9px] text-muted-foreground">ADMIN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE TAB BAR - visible only on mobile */}
                <div className="sm:hidden relative border-b border-border bg-card shrink-0">
                  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-card to-transparent" />
                  <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-card to-transparent" />
                  <div className="flex items-center overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1 px-3 py-2 min-w-max">
                      <div className="flex items-center gap-1 px-2 py-1 mr-2 border-r border-border">
                        <Image src="/logo.png" alt="AIMS" width={20} height={20} className="object-contain h-5 w-5" />
                        <span className="text-xs font-serif tracking-tight text-cream">AIMS</span>
                      </div>
                      {NAV_ITEMS.map((item) => (
                        <motion.button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 min-h-[44px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${activeView === item.id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:bg-surface"}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ActiveView />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Hint */}
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Click the sidebar tabs to explore ↑
            </p>
          </motion.div>

          {/* Experience label */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-14 text-sm font-semibold text-muted-foreground uppercase tracking-widest"
          >
            Our team has operated inside
          </motion.p>
        </div>
      </div>
    </section>
  )
}
