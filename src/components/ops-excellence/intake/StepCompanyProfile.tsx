"use client"

import { REVENUE_RANGES, EMPLOYEE_RANGES } from "@/lib/ops-excellence/config"
import type { IntakeCompanyData } from "@/lib/ops-excellence/types"

interface StepCompanyProfileProps {
  data: IntakeCompanyData
  onChange: (data: IntakeCompanyData) => void
  errors: Partial<Record<keyof IntakeCompanyData, string>>
}

const labelClass = "block text-sm font-medium text-foreground mb-1.5"
const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/20 focus:border-[#981B1B]"
const errorClass = "mt-1 text-xs text-red-400"

function RequiredMark() {
  return <span className="text-[#981B1B] ml-0.5">*</span>
}

export function StepCompanyProfile({ data, onChange, errors }: StepCompanyProfileProps) {
  function updateField<K extends keyof IntakeCompanyData>(key: K, value: IntakeCompanyData[K]) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-5">
      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className={labelClass}>
          Company Name <RequiredMark />
        </label>
        <input
          id="companyName"
          type="text"
          className={inputClass}
          placeholder="Acme Corp"
          value={data.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
        />
        {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className={labelClass}>
          Industry <RequiredMark />
        </label>
        <input
          id="industry"
          type="text"
          className={inputClass}
          placeholder="e.g. SaaS, Manufacturing, Professional Services"
          value={data.industry}
          onChange={(e) => updateField("industry", e.target.value)}
        />
        {errors.industry && <p className={errorClass}>{errors.industry}</p>}
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className={labelClass}>
          Website
        </label>
        <input
          id="website"
          type="url"
          className={inputClass}
          placeholder="https://example.com"
          value={data.website}
          onChange={(e) => updateField("website", e.target.value)}
        />
        {errors.website && <p className={errorClass}>{errors.website}</p>}
      </div>

      {/* Revenue + Employees row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Annual Revenue */}
        <div>
          <label htmlFor="annualRevenue" className={labelClass}>
            Annual Revenue Range
          </label>
          <select
            id="annualRevenue"
            className={inputClass}
            value={data.annualRevenue}
            onChange={(e) => updateField("annualRevenue", e.target.value)}
          >
            <option value="">Select range</option>
            {REVENUE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Count */}
        <div>
          <label htmlFor="employeeCount" className={labelClass}>
            Employee Count
          </label>
          <select
            id="employeeCount"
            className={inputClass}
            value={data.employeeCount}
            onChange={(e) => updateField("employeeCount", e.target.value)}
          >
            <option value="">Select range</option>
            {EMPLOYEE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Business Model */}
      <div>
        <label htmlFor="businessModel" className={labelClass}>
          Business Model
        </label>
        <input
          id="businessModel"
          type="text"
          className={inputClass}
          placeholder="e.g. B2B SaaS, eCommerce, Services"
          value={data.businessModel}
          onChange={(e) => updateField("businessModel", e.target.value)}
        />
      </div>

      {/* Number of Locations */}
      <div>
        <label htmlFor="locationCount" className={labelClass}>
          Number of Locations
        </label>
        <input
          id="locationCount"
          type="number"
          min="0"
          className={inputClass}
          placeholder="1"
          value={data.locationCount}
          onChange={(e) => updateField("locationCount", e.target.value)}
        />
      </div>
    </div>
  )
}
