"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SIGNUPS = [
  { name: "Marcus T.", location: "Austin, TX" },
  { name: "Priya S.", location: "Chicago, IL" },
  { name: "Jordan R.", location: "Denver, CO" },
  { name: "Alyssa K.", location: "Tampa, FL" },
  { name: "Devin M.", location: "Phoenix, AZ" },
  { name: "Rachel B.", location: "Nashville, TN" },
  { name: "Tyler O.", location: "Charlotte, NC" },
  { name: "Sofia G.", location: "San Diego, CA" },
  { name: "Brandon W.", location: "Columbus, OH" },
  { name: "Nadia P.", location: "Atlanta, GA" },
  { name: "Eli H.", location: "Portland, OR" },
  { name: "Camille L.", location: "Minneapolis, MN" },
  { name: "Ravi N.", location: "Dallas, TX" },
  { name: "Kayla J.", location: "Seattle, WA" },
  { name: "Anthony D.", location: "Boston, MA" },
]

export function LiveSignupTicker() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SIGNUPS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const current = SIGNUPS[index]

  return (
    <div className="mt-6 flex items-center justify-center min-h-[44px]" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-flex items-center gap-3 rounded-full border border-line bg-surface/70 backdrop-blur px-4 py-2 shadow-[0_0_25px_rgba(0,0,0,0.4)]"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-aims-gold opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-aims-gold" />
          </span>
          <span className="text-xs sm:text-sm text-cream/80">
            <span className="font-semibold text-cream">{current.name}</span>
            <span className="text-cream/50"> from {current.location} just applied</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
