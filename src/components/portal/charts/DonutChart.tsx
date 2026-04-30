/**
 * Pure-SVG donut chart. Renders a value-weighted breakdown using a
 * tonal scale of the primary color (crimson) — most-valuable slice
 * is solid primary, lesser slices fade to primary/40, primary/25,
 * primary/15, primary/8. Stays on-brand at all times.
 *
 * Center text: total value (or anything custom passed via the
 * `centerLabel` / `centerValue` props).
 *
 * Each slice carries an SVG <title> so hovering gives the operator
 * the slice label + value as a native tooltip.
 */
interface DonutChartProps {
  data: Array<{ label: string; value: number }>
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  formatValue?: (n: number) => string
  ariaLabel?: string
}

const TONAL_OPACITIES = [1, 0.6, 0.4, 0.25, 0.15, 0.08] as const

export function DonutChart({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
  formatValue = (n) => n.toLocaleString(),
  ariaLabel = "Breakdown chart",
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - thickness / 2

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground italic"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    )
  }

  // Sort biggest first so primary tonal slice is the most-valuable
  const sorted = [...data].sort((a, b) => b.value - a.value)

  // Build arc segments. Use SVG path arcs (not strokeDasharray) so we
  // can control gap + ordering precisely, and the chart renders
  // identically across browsers.
  let cumulative = 0
  const segments = sorted.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
    cumulative += d.value
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    const opacity = TONAL_OPACITIES[Math.min(i, TONAL_OPACITIES.length - 1)]

    return {
      ...d,
      path: `M ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2}`,
      opacity,
      pct: (d.value / total) * 100,
    }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={ariaLabel}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={thickness}
            opacity={0.5}
          />
          {/* Slices */}
          {segments.map((s, i) => (
            <g key={i}>
              <title>
                {`${s.label}: ${formatValue(s.value)} (${s.pct.toFixed(0)}%)`}
              </title>
              <path
                d={s.path}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={thickness}
                strokeOpacity={s.opacity}
                strokeLinecap="butt"
              />
            </g>
          ))}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <p className="text-base font-bold text-foreground tabular-nums leading-tight">
                {centerValue}
              </p>
            )}
            {centerLabel && (
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                {centerLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <ul className="w-full space-y-1">
        {segments.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-[11px]"
          >
            <span
              className="h-2 w-2 rounded-full bg-primary shrink-0"
              style={{ opacity: s.opacity }}
            />
            <span className="text-foreground truncate flex-1 min-w-0">
              {s.label}
            </span>
            <span className="text-muted-foreground tabular-nums font-medium shrink-0">
              {s.pct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
