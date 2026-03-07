"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const ORBIT_LOGOS = [
  { name: "Microsoft Teams", src: "/integrations/icons8-microsoft-teams.svg" },
  { name: "Notion", src: "/integrations/notion.svg" },
  { name: "Google Drive", src: "/integrations/google-drive-svgrepo-com.svg" },
  { name: "Slack", src: "/integrations/slack.png" },
  { name: "HubSpot", src: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Excel", src: "/integrations/excel.svg" },
  { name: "OpenAI", src: "/integrations/openai-svgrepo-com.svg" },
  { name: "LinkedIn", src: "/integrations/linkedin.svg" },
]

export function Integrations() {
  const count = ORBIT_LOGOS.length

  return (
    <section className="py-24 bg-[#F5F5F5]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">

          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 mb-4">
              Integrations
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Plugs Into Your Existing Stack
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              AIMS connects directly into the tools your team already uses. No ripping and replacing — we
              wire everything together and make it work automatically.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Works with your existing CRM",
                "API-first, Zapier & Make compatible",
                "Connects in minutes, not weeks",
                "No IT setup required",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition shadow-md shadow-red-200"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Right: orbit animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center"
          >
            <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0.06) 40%, transparent 70%)" }} />
              <div className="absolute rounded-full border border-gray-200/80" style={{ inset: 24 }} />
              <div className="absolute rounded-full border border-gray-200/40" style={{ inset: 0 }} />

              {/* Center AIMS logo */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl border border-gray-100">
                <Image src="/logo.png" alt="AIMS" width={36} height={36} className="object-contain" />
              </div>

              {/* Orbiting logos */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                {ORBIT_LOGOS.map((logo, i) => {
                  const angle = (i / count) * 2 * Math.PI
                  const radius = 130
                  const x = Math.cos(angle) * radius
                  const y = Math.sin(angle) * radius
                  return (
                    // Static positioning wrapper — Framer Motion does NOT control this div
                    <div
                      key={logo.name}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 24px)`,
                      }}
                    >
                      {/* Counter-rotate so logos stay upright */}
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md border border-gray-100"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                      >
                        <Image
                          src={logo.src}
                          alt={logo.name}
                          width={26}
                          height={26}
                          className="object-contain"
                        />
                      </motion.div>
                    </div>
                  )
                })}
              </motion.div>

              {/* Orbit ring circle */}
              <div className="absolute rounded-full border border-dashed border-red-100/60" style={{ inset: "30px" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
