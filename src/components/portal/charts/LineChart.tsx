/**
 * Pure-SVG line chart. Built without a chart library so we get perfect
 * brand control + zero kb bundle cost. Use for any X/Y trend over time:
 * MRR, paid invoices, deals created, audit submissions.
 *
 * Visual:
 *   - Stroke: solid primary (crimson)
 *   - Area fill below line: primary/10 wash
 *   - Last point: primary dot with halo
 *   - Grid: subtle horizontal lines at quartiles
 *   - Hover dots are pure CSS (no JS); the SVG <title> attribute on
 *     each invisible hit-area gives the operator the value tooltip.
 */
interface LineChartProps {
  data: Array<{ label: string; value: number }>
  height?: number
  formatValue?: (n: number) => string
  ariaLabel?: string
}

export function LineChart({
  data,
  height = 120,
  formatValue = (n) => n.toLocaleString(),
  ariaLabel = "Trend chart",
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground italic"
        style={{ height }}
      >
        No data yet
      </div>
    )
  }

  const W = 600 // viewBox width — scales with container
  const H = height
  const PADDING_X = 4
  const PADDING_TOP = 8
  const PADDING_BOTTOM = 4

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const minValue = 0 // pin to zero so flat-low days don't look like crashes
  const valueRange = maxValue - minValue || 1

  const innerW = W - PADDING_X * 2
  const innerH = H - PADDING_TOP - PADDING_BOTTOM

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? W / 2
        : PADDING_X + (i / (data.length - 1)) * innerW
    const y =
      PADDING_TOP +
      innerH -
      ((d.value - minValue) / valueRange) * innerH
    return { x, y, ...d }
  })

  // Smooth path using monotone interpolation. Avoids overshoot bumps
  // that catmull-rom would produce when a single day spikes.
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ")

  const areaPath = `${linePath} L ${points[points.length - 1].x},${H - PADDING_BOTTOM} L ${points[0].x},${H - PADDING_BOTTOM} Z`

  const lastPoint = points[points.length - 1]

  // Quartile grid lines for visual scale reference
  const gridLines = [0.25, 0.5, 0.75].map((q) => PADDING_TOP + innerH * q)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
    >
      {/* Grid */}
      {gridLines.map((y, i) => (
        <line
          key={i}
          x1={0}
          y1={y}
          x2={W}
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeWidth={1}
          className="text-foreground"
        />
      ))}

      {/* Area fill */}
      <path
        d={areaPath}
        fill="hsl(var(--primary))"
        fillOpacity={0.08}
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Last point halo + dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={6}
        fill="hsl(var(--primary))"
        fillOpacity={0.18}
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={3}
        fill="hsl(var(--primary))"
      />

      {/* Invisible hit zones provide native browser tooltips */}
      {points.map((p, i) => (
        <g key={i}>
          <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          <rect
            x={Math.max(0, p.x - innerW / data.length / 2)}
            y={0}
            width={innerW / data.length}
            height={H}
            fill="transparent"
          />
        </g>
      ))}
    </svg>
  )
}
