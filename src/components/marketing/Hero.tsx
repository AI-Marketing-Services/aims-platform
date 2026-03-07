"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, TrendingUp, Users, Zap } from "lucide-react"

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const AVATARS = [
  "https://i.pravatar.cc/32?img=1",
  "https://i.pravatar.cc/32?img=2",
  "https://i.pravatar.cc/32?img=3",
  "https://i.pravatar.cc/32?img=4",
  "https://i.pravatar.cc/32?img=5",
]

const FLOATING_TOOLS = [
  { icon: "📊", label: "Analytics", top: "15%", left: "5%", delay: 0 },
  { icon: "📧", label: "Email", top: "40%", left: "3%", delay: 0.3 },
  { icon: "🤖", label: "AI Agent", top: "65%", left: "8%", delay: 0.6 },
  { icon: "📈", label: "CRM", top: "20%", right: "6%", delay: 0.2 },
  { icon: "📞", label: "Voice", top: "50%", right: "3%", delay: 0.5 },
  { icon: "⚡", label: "Automation", top: "70%", right: "7%", delay: 0.8 },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 aims-gradient-hero" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-10 animate-blob"
        style={{ background: "radial-gradient(circle, #DC2626 0%, transparent 70%)" }}
      />

      {/* Floating tool icons */}
      {FLOATING_TOOLS.map((tool, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:flex flex-col items-center gap-1"
          style={{ top: tool.top, left: tool.left, right: (tool as { right?: string }).right }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: tool.delay + 0.5, duration: 0.4 }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white shadow-sm text-xl">
            {tool.icon}
          </div>
          <span className="text-[10px] text-muted-foreground">{tool.label}</span>
        </motion.div>
      ))}

      <div className="container mx-auto max-w-5xl px-4 text-center">
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Social proof badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 mb-8">
              <div className="flex -space-x-1.5">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-5 w-5 rounded-full border border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-red-700">
                Trusted by 1,000+ sales teams
              </span>
              <CheckCircle2 className="h-4 w-4 text-red-600" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your{" "}
            <span className="text-[#DC2626]">&ldquo;Always On&rdquo;</span>
            <br />
            AI-Powered Lead Generation
            <br />
            Partner
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            We build and run outbound campaigns, AI calling systems, and lead reactivation
            programs that fill your pipeline. More qualified meetings. Less wasted ad spend.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] hover:shadow-md"
            >
              Book a Strategy Call
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground transition hover:bg-secondary"
            >
              Browse Services
            </Link>
          </motion.div>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            No credit card required &middot; Results in 30 days or less
          </motion.p>

          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-6 rounded-2xl border border-border bg-white/60 px-6 py-5 shadow-sm backdrop-blur-sm"
          >
            {[
              { icon: TrendingUp, value: "3.2x", label: "Avg. pipeline increase" },
              { icon: Users, value: "500+", label: "Clients served" },
              { icon: Zap, value: "14 days", label: "Average time to first meeting" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto mb-1 h-5 w-5 text-[#DC2626]" />
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
