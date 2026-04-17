"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  color = "#981B1B",
  width = 80,
  height = 30,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))

  if (chartData.length < 2) return null

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
