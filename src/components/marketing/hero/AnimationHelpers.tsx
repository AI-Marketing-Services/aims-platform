"use client"

import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion"
import { useRef, useEffect, type ReactNode } from "react"

export function AnimNum({ value, prefix = "", suffix = "", delay = 0.6, format }: { value: number; prefix?: string; suffix?: string; delay?: number; format?: (v: number) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const sp = useSpring(mv, { duration: 1800, bounce: 0 })
  const display = useTransform(sp, (v) => {
    const rounded = Math.round(v)
    if (format) return format(rounded)
    return `${prefix}${rounded.toLocaleString()}${suffix}`
  })
  useEffect(() => { if (isInView) setTimeout(() => mv.set(value), delay * 1000) }, [isInView, value, mv, delay])
  return <motion.span ref={ref}>{display}</motion.span>
}

export function StaggerIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

export function PopUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.92 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function DonutChart({ pct, value }: { pct: number; value: string }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px]">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <motion.circle
          cx="36" cy="36" r={r} fill="none" stroke="#981B1B" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[11px] font-bold text-foreground">{value}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5">{pct}%</span>
      </div>
    </div>
  )
}
