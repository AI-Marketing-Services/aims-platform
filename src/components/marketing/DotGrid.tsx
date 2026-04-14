"use client"

import { useEffect, useRef, useCallback } from "react"

const GRID_SPACING = 28
const DOT_RADIUS = 1
const GLOW_RADIUS = 140
const CONNECT_RADIUS = 100
const LINE_OPACITY = 0.35

export function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const rafRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width
    const h = rect.height

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }

    ctx.clearRect(0, 0, w, h)

    const mx = mouseRef.current.x
    const my = mouseRef.current.y

    const cols = Math.ceil(w / GRID_SPACING) + 1
    const rows = Math.ceil(h / GRID_SPACING) + 1

    const glowing: { x: number; y: number; intensity: number }[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * GRID_SPACING
        const y = row * GRID_SPACING

        const dx = x - mx
        const dy = y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < GLOW_RADIUS) {
          const intensity = 1 - dist / GLOW_RADIUS
          const eased = intensity * intensity

          const r = Math.round(153 + (255 - 153) * eased)
          const g = Math.round(27 * (1 - eased * 0.5))
          const b = Math.round(27 * (1 - eased * 0.5))
          const alpha = 0.12 + eased * 0.8
          const scale = DOT_RADIUS + eased * 1.5

          ctx.beginPath()
          ctx.arc(x, y, scale, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.fill()

          glowing.push({ x, y, intensity: eased })
        } else {
          ctx.beginPath()
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(0, 0, 0, 0.07)"
          ctx.fill()
        }
      }
    }

    for (let i = 0; i < glowing.length; i++) {
      for (let j = i + 1; j < glowing.length; j++) {
        const a = glowing[i]
        const b = glowing[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < CONNECT_RADIUS) {
          const lineIntensity =
            (1 - dist / CONNECT_RADIUS) * Math.min(a.intensity, b.intensity)

          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(153, 27, 27, ${lineIntensity * LINE_OPACITY})`
          ctx.lineWidth = lineIntensity * 1.2
          ctx.stroke()
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("mouseleave", onMouseLeave)

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("mouseleave", onMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 0 }}
    />
  )
}
