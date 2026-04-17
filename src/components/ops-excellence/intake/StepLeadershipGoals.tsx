"use client"

import { PAIN_POINTS, OPERATING_SYSTEMS } from "@/lib/ops-excellence/config"
import type { IntakeLeadershipData } from "@/lib/ops-excellence/types"

interface StepLeadershipGoalsProps {
  data: IntakeLeadershipData
  onChange: (data: IntakeLeadershipData) => void
  errors: Partial<Record<keyof IntakeLeadershipData, string>>
}

const labelClass = "block text-sm font-medium text-foreground mb-1.5"
const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/20 focus:border-[#981B1B]"
const errorClass = "mt-1 text-xs text-red-400"

function RequiredMark() {
  return <span className="text-[#981B1B] ml-0.5">*</span>
}

export function StepLeadershipGoals({ data, onChange, errors }: StepLeadershipGoalsProps) {
  function updateField<K extends keyof IntakeLeadershipData>(
    key: K,
    value: IntakeLeadershipData[K]
  ) {
    onChange({ ...data, [key]: value })
  }

  function togglePainPoint(point: string) {
    const current = data.painPoints
    const next = current.includes(point)
      ? current.filter((p) => p !== point)
      : [...current, point]
    updateField("painPoints", next)
  }

  return (
    <div className="space-y-5">
      {/* CEO Info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Primary Contact (CEO / Owner)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="ceoName" className={labelClass}>
              Full Name <RequiredMark />
            </label>
            <input
              id="ceoName"
              type="text"
              className={inputClass}
              placeholder="Jane Smith"
              value={data.ceoName}
              onChange={(e) => updateField("ceoName", e.target.value)}
            />
            {errors.ceoName && <p className={errorClass}>{errors.ceoName}</p>}
          </div>
          <div>
            <label htmlFor="ceoEmail" className={labelClass}>
              Email <RequiredMark />
            </label>
            <input
              id="ceoEmail"
              type="email"
              className={inputClass}
              placeholder="jane@company.com"
              value={data.ceoEmail}
              onChange={(e) => updateField("ceoEmail", e.target.value)}
            />
            {errors.ceoEmail && <p className={errorClass}>{errors.ceoEmail}</p>}
          </div>
          <div>
            <label htmlFor="ceoPhone" className={labelClass}>
              Phone <RequiredMark />
            </label>
            <input
              id="ceoPhone"
              type="tel"
              className={inputClass}
              placeholder="(555) 123-4567"
              value={data.ceoPhone}
              onChange={(e) => updateField("ceoPhone", e.target.value)}
            />
            {errors.ceoPhone && <p className={errorClass}>{errors.ceoPhone}</p>}
          </div>
        </div>
      </div>

      {/* Integrator / COO */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Integrator / COO (Optional)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="integratorName" className={labelClass}>
              Name
            </label>
            <input
              id="integratorName"
              type="text"
              className={inputClass}
              placeholder="Full name"
              value={data.integratorName}
              onChange={(e) => updateField("integratorName", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="integratorEmail" className={labelClass}>
              Email
            </label>
            <input
              id="integratorEmail"
              type="email"
              className={inputClass}
              placeholder="integrator@company.com"
              value={data.integratorEmail}
              onChange={(e) => updateField("integratorEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Finance Lead */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Finance Lead (Optional)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="financeLeadName" className={labelClass}>
              Name
            </label>
            <input
              id="financeLeadName"
              type="text"
              className={inputClass}
              placeholder="Full name"
              value={data.financeLeadName}
              onChange={(e) => updateField("financeLeadName", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="financeLeadEmail" className={labelClass}>
              Email
            </label>
            <input
              id="financeLeadEmail"
              type="email"
              className={inputClass}
              placeholder="finance@company.com"
              value={data.financeLeadEmail}
              onChange={(e) => updateField("financeLeadEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pain Points */}
      <div>
        <p className={labelClass}>
          What operational challenges are you facing? (Select all that apply)
        </p>
        <div className="space-y-2">
          {PAIN_POINTS.map((point) => {
            const selected = data.painPoints.includes(point)
            return (
              <label
                key={point}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  selected
                    ? "border-[#981B1B]/40 bg-[#981B1B]/5"
                    : "border-border bg-card hover:border-border hover:bg-panel"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePainPoint(point)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-[#981B1B]"
                />
                <span className="text-sm text-foreground">{point}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Success Vision */}
      <div>
        <label htmlFor="successVision" className={labelClass}>
          What would success look like in 90 days?
        </label>
        <textarea
          id="successVision"
          rows={4}
          className={inputClass}
          placeholder="Describe the outcomes that would make this engagement a clear win..."
          value={data.successVision}
          onChange={(e) => updateField("successVision", e.target.value)}
        />
      </div>

      {/* Operating System */}
      <div>
        <label htmlFor="operatingSystem" className={labelClass}>
          Operating System in Use
        </label>
        <select
          id="operatingSystem"
          className={inputClass}
          value={data.operatingSystem}
          onChange={(e) => updateField("operatingSystem", e.target.value)}
        >
          <option value="">Select one</option>
          {OPERATING_SYSTEMS.map((os) => (
            <option key={os} value={os}>
              {os}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
