"use client"

import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion"
import { useRef, useEffect, type ReactNode } from "react"

// ─── Page-level entrance ─────────────────────────────────────────────────────

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Staggered section container ─────────────────────────────────────────────

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Individual animated card ────────────────────────────────────────────────

export function AnimatedCard({
  children,
  className,
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <motion.div
      className={`${className ?? ""} ${glow ? "animated-glow-card" : ""}`}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{
        y: -2,
        boxShadow: glow
          ? "0 8px 30px -4px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.1)"
          : "0 8px 30px -8px rgba(0, 0, 0, 0.12)",
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Pop-in from bottom (for leads, activity items) ──────────────────────────

export function PopInItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.9 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated counting number ────────────────────────────────────────────────

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.5,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v)
    return `${prefix}${rounded.toLocaleString()}${suffix}`
  })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

// ─── Animated dollar counter ─────────────────────────────────────────────────

export function AnimatedDollar({
  value,
  duration = 1.5,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => `$${Math.round(v).toLocaleString()}`)

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

// ─── Animated percentage counter ─────────────────────────────────────────────

export function AnimatedPercent({
  value,
  duration = 1.5,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => `${Math.round(v)}%`)

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

// ─── Animated progress bar ───────────────────────────────────────────────────

export function AnimatedProgressBar({
  percentage,
  className = "bg-red-600",
  delay = 0.3,
}: {
  percentage: number
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${className}`}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${Math.min(percentage, 100)}%` } : { width: 0 }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

// ─── Slide-in from left (for sidebar items) ──────────────────────────────────

export function SlideInFromLeft({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
