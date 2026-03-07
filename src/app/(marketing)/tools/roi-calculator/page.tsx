"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Calculator, TrendingUp, DollarSign, Users, ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
  hint?: string
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-lg font-bold text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#DC2626]"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function ROICalculatorPage() {
  const [leadsPerMonth, setLeadsPerMonth] = useState(50)
  const [closeRate, setCloseRate] = useState(10)
  const [avgDealValue, setAvgDealValue] = useState(3000)
  const [monthlyAdSpend, setMonthlyAdSpend] = useState(2000)

  const [emailGate, setEmailGate] = useState(false)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Projections with AIMS
  const results = useMemo(() => {
    const currentClients = leadsPerMonth * (closeRate / 100)
    const currentRevenue = currentClients * avgDealValue

    // AIMS impact assumptions (conservative)
    const aimsLeadMultiplier = 2.8  // 2.8x more leads from AI outbound
    const aimsCloseRateBoost = 1.4  // 40% higher close rate with faster follow-up
    const aimsLeads = leadsPerMonth * aimsLeadMultiplier
    const aimsCloseRate = Math.min(closeRate * aimsCloseRateBoost, 35)
    const aimsClients = aimsLeads * (aimsCloseRate / 100)
    const aimsRevenue = aimsClients * avgDealValue

    const additionalRevenue = aimsRevenue - currentRevenue
    const aimsMonthlyFee = 297 // Pro plan
    const roi = ((additionalRevenue - aimsMonthlyFee) / aimsMonthlyFee) * 100
    const payback = aimsMonthlyFee / (additionalRevenue / 30) // days to payback

    return {
      currentRevenue,
      aimsRevenue,
      additionalRevenue,
      roi,
      payback: Math.round(payback),
      aimsLeads: Math.round(aimsLeads),
      aimsClients: Math.round(aimsClients),
      aimsCloseRate: Math.round(aimsCloseRate * 10) / 10,
    }
  }, [leadsPerMonth, closeRate, avgDealValue, monthlyAdSpend])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ROI_CALCULATOR",
          email,
          data: {
            inputs: { leadsPerMonth, closeRate, avgDealValue, monthlyAdSpend },
            results,
          },
        }),
      })
    } catch {}
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">AIMS ROI Calculator</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#DC2626] text-sm font-medium rounded-full mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            Free ROI Calculator
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What Would AIMS Return on Your Investment?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Adjust the sliders to match your current numbers and see the projected revenue impact of adding AIMS to your growth stack.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">
            <h2 className="text-lg font-bold text-gray-900">Your Current Numbers</h2>

            <Slider
              label="New leads per month"
              value={leadsPerMonth}
              onChange={setLeadsPerMonth}
              min={10}
              max={500}
              step={10}
              format={(v) => `${v} leads`}
              hint="Inbound + outbound combined"
            />
            <Slider
              label="Current close rate"
              value={closeRate}
              onChange={setCloseRate}
              min={1}
              max={30}
              step={0.5}
              format={(v) => `${v}%`}
              hint="Percentage of leads that become paying clients"
            />
            <Slider
              label="Average deal value"
              value={avgDealValue}
              onChange={setAvgDealValue}
              min={500}
              max={25000}
              step={500}
              format={(v) => formatCurrency(v)}
              hint="One-time or first-month value"
            />
            <Slider
              label="Monthly marketing spend"
              value={monthlyAdSpend}
              onChange={setMonthlyAdSpend}
              min={0}
              max={20000}
              step={500}
              format={(v) => formatCurrency(v)}
              hint="Ads, tools, agency fees currently"
            />
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Current vs Projected */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-1">Current Revenue</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(results.currentRevenue)}
                </div>
                <div className="text-sm text-gray-400 mt-1">/month from new clients</div>
              </div>
              <div className="bg-[#DC2626] rounded-2xl p-6 text-white">
                <div className="text-sm text-red-200 mb-1">With AIMS</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(results.aimsRevenue)}
                </div>
                <div className="text-sm text-red-200 mt-1">/month projected</div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-5">Projected Impact</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: <TrendingUp className="w-4 h-4 text-green-600" />,
                    label: "Additional monthly revenue",
                    value: formatCurrency(results.additionalRevenue),
                    color: "text-green-600",
                  },
                  {
                    icon: <Users className="w-4 h-4 text-blue-600" />,
                    label: "Projected new leads/month",
                    value: `${results.aimsLeads} leads`,
                    color: "text-blue-600",
                  },
                  {
                    icon: <DollarSign className="w-4 h-4 text-purple-600" />,
                    label: "Estimated ROI",
                    value: `${results.roi > 0 ? "+" : ""}${Math.round(results.roi)}%`,
                    color: results.roi > 0 ? "text-green-600" : "text-red-500",
                  },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {m.icon}
                      {m.label}
                    </div>
                    <span className={cn("font-bold text-lg", m.color)}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assumptions note */}
            <div className="flex gap-2 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Projections based on 2.8x lead volume increase and 40% close rate improvement — typical AIMS client results after 60 days.</span>
            </div>

            {/* CTA */}
            {!submitted ? (
              !emailGate ? (
                <button
                  onClick={() => setEmailGate(true)}
                  className="w-full py-4 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2"
                >
                  Get My Full ROI Report
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Send me the full report</h4>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-gray-900"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
                  >
                    Send My Report
                  </button>
                </form>
              )
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="text-green-700 font-semibold mb-2">Report sent to {email}</div>
                <a
                  href="/get-started"
                  className="inline-flex items-center gap-2 text-[#DC2626] font-medium hover:underline"
                >
                  Book a strategy call to review it together <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
