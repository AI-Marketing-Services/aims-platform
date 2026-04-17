"use client"

import {
  COMMON_TOOLS,
  TOOL_COUNT_RANGES,
  DATA_MATURITY_OPTIONS,
  AI_USAGE_OPTIONS,
} from "@/lib/ops-excellence/config"
import type { IntakeTechnologyData } from "@/lib/ops-excellence/types"

interface StepTechnologyProps {
  data: IntakeTechnologyData
  onChange: (data: IntakeTechnologyData) => void
}

const labelClass = "block text-sm font-medium text-foreground mb-1.5"
const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/20 focus:border-[#981B1B]"

export function StepTechnology({ data, onChange }: StepTechnologyProps) {
  function updateField<K extends keyof IntakeTechnologyData>(
    key: K,
    value: IntakeTechnologyData[K]
  ) {
    onChange({ ...data, [key]: value })
  }

  function toggleTool(tool: string) {
    const current = data.currentTools
    const next = current.includes(tool)
      ? current.filter((t) => t !== tool)
      : [...current, tool]
    updateField("currentTools", next)
  }

  return (
    <div className="space-y-5">
      {/* Current Tools */}
      <div>
        <p className={labelClass}>Current Tools (Select all that apply)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {COMMON_TOOLS.map((tool) => {
            const selected = data.currentTools.includes(tool)
            return (
              <label
                key={tool}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                  selected
                    ? "border-[#981B1B]/40 bg-[#981B1B]/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border hover:bg-panel"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleTool(tool)}
                  className="h-3.5 w-3.5 rounded border-border accent-[#981B1B]"
                />
                <span>{tool}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Other Tools */}
      <div>
        <label htmlFor="otherTools" className={labelClass}>
          Other Tools Not Listed Above
        </label>
        <textarea
          id="otherTools"
          rows={3}
          className={inputClass}
          placeholder="List any additional tools your team uses..."
          value={data.otherTools}
          onChange={(e) => updateField("otherTools", e.target.value)}
        />
      </div>

      {/* Tool Count */}
      <div>
        <label htmlFor="toolCount" className={labelClass}>
          Approximate Total Number of Tools / Subscriptions
        </label>
        <select
          id="toolCount"
          className={inputClass}
          value={data.toolCount}
          onChange={(e) => updateField("toolCount", e.target.value)}
        >
          <option value="">Select range</option>
          {TOOL_COUNT_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      {/* Data Maturity */}
      <div>
        <p className={labelClass}>Data Maturity</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DATA_MATURITY_OPTIONS.map((opt) => {
            const selected = data.dataMaturit === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("dataMaturit", opt.value)}
                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                  selected
                    ? "border-[#981B1B]/50 bg-[#981B1B]/5 ring-1 ring-[#981B1B]/20"
                    : "border-border bg-card hover:border-border hover:bg-panel"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    selected ? "text-[#981B1B]" : "text-foreground"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Usage */}
      <div>
        <label htmlFor="aiUsage" className={labelClass}>
          Current AI Usage
        </label>
        <select
          id="aiUsage"
          className={inputClass}
          value={data.aiUsage}
          onChange={(e) => updateField("aiUsage", e.target.value)}
        >
          <option value="">Select one</option>
          {AI_USAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
