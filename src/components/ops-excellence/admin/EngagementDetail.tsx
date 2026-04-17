"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Building2,
  ClipboardList,
  Search as SearchIcon,
  DollarSign,
  Cpu,
  Calculator,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Clock,
  TrendingDown,
  AlertCircle,
} from "lucide-react"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import {
  ENGAGEMENT_STAGES,
  ENGAGEMENT_TIERS,
  CFO_TEST_QUESTIONS,
  DIMENSION_CONFIG,
  DEPARTMENTS,
  FREQUENCY_LABELS,
  SPEND_DECISION_LABELS,
  TIER_DEFINITIONS,
  CONFIDENCE_TIERS,
} from "@/lib/ops-excellence/config"
import type {
  DashboardData,
  CFOTestResponse,
  CFOResponseScore,
  EngagementStage,
} from "@/lib/ops-excellence/types"

// ── Types ───────────────────────────────────────────────────

interface Props {
  engagementId: string
}

type TabId = "overview" | "intake" | "discovery" | "spend" | "automations" | "score"

interface DiscoveryCard {
  id: string
  department: string
  processName: string
  ownerRole: string
  frequency: string
  timePerInstance: number
  complexityScore: number
  valueScore: number
  tier: number
  automationCandidate: string | null
  toolsUsed: string[]
  painPoints: string | null
  annualCost: number | null
  validated: boolean
}

interface SpendDecision {
  id: string
  vendorName: string
  toolName: string | null
  currentAnnualCost: number
  decision: string
  newAnnualCost: number | null
  dollarDelta: number | null
  decisionOwner: string
  rationale: string | null
  status: string
  renewalDate: string | null
  usageLevel: string | null
}

interface AutomationCard {
  id: string
  processName: string
  department: string
  roleAffected: string
  fullyLoadedHourlyCost: number
  baselineTimePerInstance: number
  baselineFrequency: string
  baselineMonthlyHours: number
  baselineMonthlyCost: number
  deployedAt: string | null
  hoursFreedPerMonth: number | null
  dollarValueFreed: number | null
  automationHealthScore: number | null
  postDeploymentTimePerInstance: number | null
  postDeploymentMonthlyHours: number | null
}

interface ScoreRecord {
  id: string
  version: number
  compositeScore: number
  confidenceTier: string
  confidencePercent: number
  financialClarity: number
  aiReadiness: number
  capacityRoi: number
  spendEfficiency: number
  calculatedAt: string
  totalHoursFreed: number | null
  totalDollarsSaved: number | null
  automationsDeployed: number | null
}

// ── Reusable Sub-Components ─────────────────────────────────

function TabButton({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-b-2 border-[#981B1B] text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6", className)}>
      {children}
    </div>
  )
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  step,
  required,
}: {
  label: string
  value: string | number
  onChange: (val: string) => void
  type?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50"
      />
    </label>
  )
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "bg-[#981B1B] text-white hover:bg-[#791515] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "inline-flex items-center gap-2"
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

function DangerButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function StageBadge({ stage }: { stage: string }) {
  const config = ENGAGEMENT_STAGES[stage as keyof typeof ENGAGEMENT_STAGES]
  if (!config) return <span className="text-xs text-muted-foreground">{stage}</span>
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
      {config.label}
    </span>
  )
}

function CFOScoreBadge({ score }: { score: CFOResponseScore }) {
  const styles: Record<CFOResponseScore, string> = {
    GREEN: "text-emerald-400 bg-emerald-900/20",
    YELLOW: "text-yellow-400 bg-yellow-900/20",
    RED: "text-red-400 bg-red-900/20",
  }
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", styles[score])}>
      {score}
    </span>
  )
}

function DimensionBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function EngagementDetail({ engagementId }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops-excellence/dashboard/${engagementId}`)
      if (!res.ok) throw new Error("Failed to load")
      const json = await res.json()
      setDashboard(json.data)
    } catch {
      toast.error("Failed to load engagement data")
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load engagement data.</p>
        </div>
      </Card>
    )
  }

  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "intake", label: "Intake & CFO Test", icon: ClipboardList },
    { id: "discovery", label: "Discovery Cards", icon: SearchIcon },
    { id: "spend", label: "Spend Challenge", icon: DollarSign },
    { id: "automations", label: "Automations", icon: Cpu },
    { id: "score", label: "Calculate Score", icon: Calculator },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          engagementId={engagementId}
          dashboard={dashboard}
          onRefresh={fetchDashboard}
        />
      )}
      {activeTab === "intake" && (
        <IntakeTab engagementId={engagementId} dashboard={dashboard} onRefresh={fetchDashboard} />
      )}
      {activeTab === "discovery" && (
        <DiscoveryTab engagementId={engagementId} />
      )}
      {activeTab === "spend" && (
        <SpendTab engagementId={engagementId} />
      )}
      {activeTab === "automations" && (
        <AutomationsTab engagementId={engagementId} />
      )}
      {activeTab === "score" && (
        <ScoreTab engagementId={engagementId} dashboard={dashboard} onRefresh={fetchDashboard} />
      )}
    </div>
  )
}

// ── Tab 1: Overview ─────────────────────────────────────────

function OverviewTab({
  engagementId,
  dashboard,
  onRefresh,
}: {
  engagementId: string
  dashboard: DashboardData
  onRefresh: () => void
}) {
  const { engagement, latestScore, capacityMetrics, spendMetrics, discoveryMetrics } = dashboard
  const [stage, setStage] = useState(engagement.stage)
  const [integratorId, setIntegratorId] = useState("")
  const [saving, setSaving] = useState(false)

  const stageOptions = Object.entries(ENGAGEMENT_STAGES).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/ops-excellence/engagement/${engagementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: stage !== engagement.stage ? stage : undefined,
          integratorId: integratorId || undefined,
        }),
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success("Engagement updated")
      onRefresh()
    } catch {
      toast.error("Failed to update engagement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Info + Controls */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Engagement Info</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs block">Company</span>
              <span className="text-foreground font-medium">{engagement.companyName}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Tier</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                engagement.tier === "PROVE" ? "text-emerald-400 bg-emerald-900/20" :
                engagement.tier === "EXECUTE" ? "text-blue-400 bg-blue-900/20" :
                "text-yellow-400 bg-yellow-900/20"
              )}>
                {ENGAGEMENT_TIERS[engagement.tier as keyof typeof ENGAGEMENT_TIERS]?.label ?? engagement.tier}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Current Stage</span>
              <StageBadge stage={engagement.stage} />
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Start Date</span>
              <span className="text-foreground">{formatDate(engagement.startDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Days Active</span>
              <span className="text-foreground font-medium">{engagement.daysSinceStart}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Industry</span>
              <span className="text-foreground">{engagement.industry ?? "--"}</span>
            </div>
          </div>
        </Card>

        {/* Stage + Integrator Controls */}
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Engagement Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Advance Stage"
              value={stage}
              onChange={(v) => setStage(v as EngagementStage)}
              options={stageOptions}
            />
            <FormInput
              label="Integrator ID"
              value={integratorId}
              onChange={setIntegratorId}
              placeholder="Assign integrator..."
            />
          </div>
          <div className="mt-4">
            <PrimaryButton onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              Save Changes
            </PrimaryButton>
          </div>
        </Card>

        {/* Latest Score */}
        {latestScore && (
          <Card>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Latest Score (V{latestScore.version})</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl font-bold text-foreground">{latestScore.compositeScore}</div>
              <div className="text-sm">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  CONFIDENCE_TIERS[latestScore.confidenceTier as keyof typeof CONFIDENCE_TIERS]?.bgColor,
                  CONFIDENCE_TIERS[latestScore.confidenceTier as keyof typeof CONFIDENCE_TIERS]?.color,
                )}>
                  {latestScore.confidenceTier} ({latestScore.confidencePercent}%)
                </span>
                <p className="text-muted-foreground mt-1 text-xs">
                  Calculated {formatDate(latestScore.calculatedAt)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
                <DimensionBar
                  key={key}
                  label={config.label}
                  value={latestScore[key as keyof typeof latestScore] as number ?? 0}
                  max={config.maxScore}
                  color={config.color}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Quick Stats */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Hours Freed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {capacityMetrics.totalHoursFreedPerMonth.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Dollars Saved</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(spendMetrics.totalSavingsRealized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(spendMetrics.totalSavingsIdentified)} identified
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Automations</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{capacityMetrics.totalAutomations}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Discovery Cards</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{discoveryMetrics.totalCards}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {discoveryMetrics.automationCandidates} candidates
          </p>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 2: Intake & CFO Test ────────────────────────────────

function IntakeTab({
  engagementId,
  dashboard,
  onRefresh,
}: {
  engagementId: string
  dashboard: DashboardData
  onRefresh: () => void
}) {
  const { cfoTest } = dashboard
  const [responses, setResponses] = useState<CFOTestResponse[]>(
    cfoTest?.responses ?? CFO_TEST_QUESTIONS.map((q) => ({ questionId: q.id, score: "YELLOW" as CFOResponseScore, notes: "" }))
  )
  const [callNotes, setCallNotes] = useState("")
  const [savingCfo, setSavingCfo] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  function updateResponse(questionId: string, field: "score" | "notes", value: string) {
    setResponses((prev) =>
      prev.map((r) =>
        r.questionId === questionId ? { ...r, [field]: value } : r
      )
    )
  }

  async function saveCFOTest() {
    setSavingCfo(true)
    try {
      const res = await fetch("/api/ops-excellence/cfo-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId, responses }),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("CFO Test results saved")
      onRefresh()
    } catch {
      toast.error("Failed to save CFO Test results")
    } finally {
      setSavingCfo(false)
    }
  }

  async function saveCallNotes() {
    if (!callNotes.trim()) return
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/ops-excellence/engagement/${engagementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callNotes }),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Call notes saved")
    } catch {
      toast.error("Failed to save call notes")
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Intake Data (read-only) */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Intake Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Company</span>
            <span className="text-foreground font-medium">{dashboard.engagement.companyName}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Industry</span>
            <span className="text-foreground">{dashboard.engagement.industry ?? "--"}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Stage</span>
            <StageBadge stage={dashboard.engagement.stage} />
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Tier</span>
            <span className="text-foreground">
              {ENGAGEMENT_TIERS[dashboard.engagement.tier as keyof typeof ENGAGEMENT_TIERS]?.label ?? dashboard.engagement.tier}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Start Date</span>
            <span className="text-foreground">{formatDate(dashboard.engagement.startDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Days Active</span>
            <span className="text-foreground">{dashboard.engagement.daysSinceStart}d</span>
          </div>
        </div>
      </Card>

      {/* CFO Test Summary */}
      {cfoTest && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">CFO Test Summary</h3>
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-foreground">{cfoTest.greenCount} Green</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm text-foreground">{cfoTest.yellowCount} Yellow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm text-foreground">{cfoTest.redCount} Red</span>
            </div>
          </div>
        </Card>
      )}

      {/* CFO Test Questions */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">CFO Test Scoring</h3>
        <div className="space-y-4">
          {CFO_TEST_QUESTIONS.map((q, idx) => {
            const response = responses.find((r) => r.questionId === q.id)
            return (
              <div key={q.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Question {idx + 1}</p>
                    <p className="text-sm text-foreground font-medium">{q.question}</p>
                  </div>
                  <select
                    value={response?.score ?? "YELLOW"}
                    onChange={(e) => updateResponse(q.id, "score", e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50 min-w-[100px]"
                  >
                    <option value="GREEN">Green</option>
                    <option value="YELLOW">Yellow</option>
                    <option value="RED">Red</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="p-2 rounded-lg bg-emerald-900/10">
                    <span className="text-emerald-400 font-medium block mb-0.5">Green</span>
                    <span className="text-muted-foreground">{q.greenAnswer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-900/10">
                    <span className="text-yellow-400 font-medium block mb-0.5">Yellow</span>
                    <span className="text-muted-foreground">{q.yellowAnswer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-red-900/10">
                    <span className="text-red-400 font-medium block mb-0.5">Red</span>
                    <span className="text-muted-foreground">{q.redAnswer}</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={response?.notes ?? ""}
                  onChange={(e) => updateResponse(q.id, "notes", e.target.value)}
                  placeholder="Admin notes..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50"
                />
              </div>
            )
          })}
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={saveCFOTest} loading={savingCfo}>
            <Save className="h-4 w-4" />
            Save CFO Test Scores
          </PrimaryButton>
        </div>
      </Card>

      {/* Call Notes */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Discovery Call Notes</h3>
        <textarea
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          placeholder="Record notes from the discovery call..."
          rows={6}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50 resize-y"
        />
        <div className="mt-4">
          <PrimaryButton onClick={saveCallNotes} loading={savingNotes}>
            <Save className="h-4 w-4" />
            Save Notes
          </PrimaryButton>
        </div>
      </Card>
    </div>
  )
}

// ── Tab 3: Discovery Cards ──────────────────────────────────

function DiscoveryTab({ engagementId }: { engagementId: string }) {
  const [cards, setCards] = useState<DiscoveryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    department: "",
    processName: "",
    ownerRole: "",
    frequency: "WEEKLY",
    timePerInstance: 0,
    complexityScore: 3,
    valueScore: 3,
    automationCandidate: "MAYBE",
    toolsUsed: "",
    painPoints: "",
    annualCost: 0,
  }
  const [form, setForm] = useState(emptyForm)

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops-excellence/discovery-cards?engagementId=${engagementId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      setCards(json.data ?? [])
    } catch {
      toast.error("Failed to load discovery cards")
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  async function handleCreate() {
    if (!form.processName || !form.department || !form.ownerRole) {
      toast.error("Process name, department, and owner role are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ops-excellence/discovery-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          ...form,
          timePerInstance: Number(form.timePerInstance),
          complexityScore: Number(form.complexityScore),
          valueScore: Number(form.valueScore),
          annualCost: form.annualCost ? Number(form.annualCost) : undefined,
          toolsUsed: form.toolsUsed ? form.toolsUsed.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) throw new Error("Create failed")
      toast.success("Discovery card created")
      setForm(emptyForm)
      setShowForm(false)
      fetchCards()
    } catch {
      toast.error("Failed to create discovery card")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/ops-excellence/discovery-cards/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Discovery card deleted")
      fetchCards()
    } catch {
      toast.error("Failed to delete card")
    }
  }

  const stats = {
    total: cards.length,
    byTier: cards.reduce<Record<number, number>>((acc, c) => {
      acc[c.tier] = (acc[c.tier] ?? 0) + 1
      return acc
    }, {}),
    byDept: cards.reduce<Record<string, number>>((acc, c) => {
      acc[c.department] = (acc[c.department] ?? 0) + 1
      return acc
    }, {}),
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cards</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        {[1, 2, 3].map((tier) => {
          const def = TIER_DEFINITIONS[tier as keyof typeof TIER_DEFINITIONS]
          return (
            <Card key={tier} className="!p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{def?.label ?? `Tier ${tier}`}</p>
              <p className={cn("text-2xl font-bold", def?.color ?? "text-foreground")}>{stats.byTier[tier] ?? 0}</p>
            </Card>
          )
        })}
      </div>

      {/* Add Card Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">All Discovery Cards</h3>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Card
        </PrimaryButton>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <h4 className="text-sm font-semibold text-foreground mb-4">New Discovery Card</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput label="Process Name" value={form.processName} onChange={(v) => setForm({ ...form, processName: v })} required />
            <FormSelect
              label="Department"
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              required
            />
            <FormInput label="Owner Role" value={form.ownerRole} onChange={(v) => setForm({ ...form, ownerRole: v })} required />
            <FormSelect
              label="Frequency"
              value={form.frequency}
              onChange={(v) => setForm({ ...form, frequency: v })}
              options={Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <FormInput label="Time / Instance (min)" type="number" value={form.timePerInstance} onChange={(v) => setForm({ ...form, timePerInstance: Number(v) })} min={0} />
            <FormInput label="Tools Used (comma-separated)" value={form.toolsUsed} onChange={(v) => setForm({ ...form, toolsUsed: v })} placeholder="Slack, Google Sheets" />
            <FormInput label="Complexity (1-5)" type="number" value={form.complexityScore} onChange={(v) => setForm({ ...form, complexityScore: Number(v) })} min={1} max={5} />
            <FormInput label="Value (1-5)" type="number" value={form.valueScore} onChange={(v) => setForm({ ...form, valueScore: Number(v) })} min={1} max={5} />
            <FormSelect
              label="Automation Candidate"
              value={form.automationCandidate}
              onChange={(v) => setForm({ ...form, automationCandidate: v })}
              options={[
                { value: "YES", label: "Yes" },
                { value: "NO", label: "No" },
                { value: "MAYBE", label: "Maybe" },
              ]}
            />
            <FormInput label="Annual Cost ($)" type="number" value={form.annualCost} onChange={(v) => setForm({ ...form, annualCost: Number(v) })} min={0} />
            <div className="sm:col-span-2 lg:col-span-3">
              <FormInput label="Pain Points" value={form.painPoints} onChange={(v) => setForm({ ...form, painPoints: v })} placeholder="Describe pain points..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <PrimaryButton onClick={handleCreate} loading={saving}>
              <Save className="h-4 w-4" />
              Create Card
            </PrimaryButton>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Cards Table */}
      {cards.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <SearchIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No discovery cards yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Process</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Department</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Owner</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Frequency</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Time</th>
                  <th className="text-center text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">C/V</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Tier</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Auto?</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => {
                  const tierDef = TIER_DEFINITIONS[card.tier as keyof typeof TIER_DEFINITIONS]
                  const isExpanded = expandedId === card.id
                  return (
                    <tr key={card.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : card.id)}
                          className="flex items-center gap-1.5 text-foreground hover:text-[#981B1B] transition-colors font-medium"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {card.processName}
                        </button>
                        {isExpanded && (
                          <div className="mt-3 space-y-2 text-xs text-muted-foreground pl-5">
                            {card.toolsUsed.length > 0 && (
                              <p><span className="text-foreground">Tools:</span> {card.toolsUsed.join(", ")}</p>
                            )}
                            {card.painPoints && (
                              <p><span className="text-foreground">Pain Points:</span> {card.painPoints}</p>
                            )}
                            {card.annualCost !== null && card.annualCost > 0 && (
                              <p><span className="text-foreground">Annual Cost:</span> {formatCurrency(card.annualCost)}</p>
                            )}
                            <p><span className="text-foreground">Validated:</span> {card.validated ? "Yes" : "No"}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{card.department}</td>
                      <td className="px-4 py-3 text-muted-foreground">{card.ownerRole}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {FREQUENCY_LABELS[card.frequency as keyof typeof FREQUENCY_LABELS] ?? card.frequency}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{card.timePerInstance}m</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{card.complexityScore}/{card.valueScore}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tierDef?.bgColor, tierDef?.color)}>
                          {tierDef?.label ?? `T${card.tier}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          card.automationCandidate === "YES" ? "text-emerald-400 bg-emerald-900/20" :
                          card.automationCandidate === "NO" ? "text-red-400 bg-red-900/20" :
                          "text-yellow-400 bg-yellow-900/20"
                        )}>
                          {card.automationCandidate ?? "Maybe"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DangerButton onClick={() => handleDelete(card.id)}>
                          <Trash2 className="h-3.5 w-3.5 inline" />
                        </DangerButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Tab 4: Spend Challenge ──────────────────────────────────

function SpendTab({ engagementId }: { engagementId: string }) {
  const [decisions, setDecisions] = useState<SpendDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    vendorName: "",
    toolName: "",
    currentAnnualCost: 0,
    decision: "JUSTIFY",
    newAnnualCost: 0,
    decisionOwner: "",
    rationale: "",
    usageLevel: "UNKNOWN",
  }
  const [form, setForm] = useState(emptyForm)

  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops-excellence/spend-decisions?engagementId=${engagementId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      setDecisions(json.data ?? [])
    } catch {
      toast.error("Failed to load spend decisions")
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchDecisions()
  }, [fetchDecisions])

  async function handleCreate() {
    if (!form.vendorName || !form.decisionOwner) {
      toast.error("Vendor name and decision owner are required")
      return
    }
    setSaving(true)
    try {
      const dollarDelta = Number(form.currentAnnualCost) - Number(form.newAnnualCost)
      const res = await fetch("/api/ops-excellence/spend-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          vendorName: form.vendorName,
          toolName: form.toolName || undefined,
          currentAnnualCost: Number(form.currentAnnualCost),
          decision: form.decision,
          newAnnualCost: form.newAnnualCost ? Number(form.newAnnualCost) : undefined,
          dollarDelta: dollarDelta > 0 ? dollarDelta : undefined,
          decisionOwner: form.decisionOwner,
          rationale: form.rationale || undefined,
          usageLevel: form.usageLevel !== "UNKNOWN" ? form.usageLevel : undefined,
        }),
      })
      if (!res.ok) throw new Error("Create failed")
      toast.success("Spend decision created")
      setForm(emptyForm)
      setShowForm(false)
      fetchDecisions()
    } catch {
      toast.error("Failed to create spend decision")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    try {
      const res = await fetch(`/api/ops-excellence/spend-decisions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success("Status updated")
      fetchDecisions()
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/ops-excellence/spend-decisions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Spend decision deleted")
      fetchDecisions()
    } catch {
      toast.error("Failed to delete decision")
    }
  }

  const totals = {
    identified: decisions.reduce((s, d) => s + (d.dollarDelta && d.dollarDelta > 0 ? d.dollarDelta : 0), 0),
    realized: decisions.filter((d) => d.status === "COMPLETE").reduce((s, d) => s + (d.dollarDelta && d.dollarDelta > 0 ? d.dollarDelta : 0), 0),
    backlog: decisions.filter((d) => d.status !== "COMPLETE").reduce((s, d) => s + (d.dollarDelta && d.dollarDelta > 0 ? d.dollarDelta : 0), 0),
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Identified</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.identified)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Realized</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totals.realized)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Backlog</p>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totals.backlog)}</p>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Spend Decisions</h3>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Decision
        </PrimaryButton>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <h4 className="text-sm font-semibold text-foreground mb-4">New Spend Decision</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput label="Vendor" value={form.vendorName} onChange={(v) => setForm({ ...form, vendorName: v })} required />
            <FormInput label="Tool Name" value={form.toolName} onChange={(v) => setForm({ ...form, toolName: v })} />
            <FormInput label="Current Annual Cost ($)" type="number" value={form.currentAnnualCost} onChange={(v) => setForm({ ...form, currentAnnualCost: Number(v) })} min={0} />
            <FormSelect
              label="Decision"
              value={form.decision}
              onChange={(v) => setForm({ ...form, decision: v })}
              options={Object.entries(SPEND_DECISION_LABELS).map(([value, config]) => ({ value, label: config.label }))}
              required
            />
            <FormInput label="New Annual Cost ($)" type="number" value={form.newAnnualCost} onChange={(v) => setForm({ ...form, newAnnualCost: Number(v) })} min={0} />
            <FormInput label="Decision Owner" value={form.decisionOwner} onChange={(v) => setForm({ ...form, decisionOwner: v })} required />
            <FormSelect
              label="Usage Level"
              value={form.usageLevel}
              onChange={(v) => setForm({ ...form, usageLevel: v })}
              options={[
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
                { value: "UNKNOWN", label: "Unknown" },
              ]}
            />
            <div className="sm:col-span-2">
              <FormInput label="Rationale" value={form.rationale} onChange={(v) => setForm({ ...form, rationale: v })} placeholder="Why this decision..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <PrimaryButton onClick={handleCreate} loading={saving}>
              <Save className="h-4 w-4" />
              Create Decision
            </PrimaryButton>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Table */}
      {decisions.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <DollarSign className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No spend decisions yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Vendor</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Tool</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Current</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Decision</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">New Cost</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Savings</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Owner</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Status</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => {
                  const decisionConfig = SPEND_DECISION_LABELS[d.decision as keyof typeof SPEND_DECISION_LABELS]
                  const statusColors: Record<string, string> = {
                    PENDING: "text-yellow-400 bg-yellow-900/20",
                    IN_PROGRESS: "text-blue-400 bg-blue-900/20",
                    COMPLETE: "text-emerald-400 bg-emerald-900/20",
                  }
                  return (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-panel/50 transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium">{d.vendorName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.toolName ?? "--"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(d.currentAnnualCost)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", decisionConfig?.bgColor, decisionConfig?.color)}>
                          {decisionConfig?.label ?? d.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {d.newAnnualCost !== null ? formatCurrency(d.newAnnualCost) : "--"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.dollarDelta !== null && d.dollarDelta > 0 ? (
                          <span className="text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {formatCurrency(d.dollarDelta)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.decisionOwner}</td>
                      <td className="px-4 py-3">
                        <select
                          value={d.status}
                          onChange={(e) => handleStatusUpdate(d.id, e.target.value)}
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#981B1B]/50",
                            statusColors[d.status] ?? "text-muted-foreground bg-muted/20"
                          )}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETE">Complete</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DangerButton onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-3.5 w-3.5 inline" />
                        </DangerButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Tab 5: Automations ──────────────────────────────────────

function AutomationsTab({ engagementId }: { engagementId: string }) {
  const [cards, setCards] = useState<AutomationCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    processName: "",
    department: "",
    roleAffected: "",
    fullyLoadedHourlyCost: 0,
    baselineTimePerInstance: 0,
    baselineFrequency: "WEEKLY",
    baselineMonthlyHours: 0,
    baselineMonthlyCost: 0,
  }
  const [form, setForm] = useState(emptyForm)

  const [editForm, setEditForm] = useState({
    postDeploymentTimePerInstance: 0,
    postDeploymentMonthlyHours: 0,
    hoursFreedPerMonth: 0,
    dollarValueFreed: 0,
    automationHealthScore: 0,
    deployedAt: "",
  })

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops-excellence/automation-cards?engagementId=${engagementId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      setCards(json.data ?? [])
    } catch {
      toast.error("Failed to load automation cards")
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  async function handleCreate() {
    if (!form.processName || !form.department || !form.roleAffected) {
      toast.error("Process name, department, and role affected are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ops-excellence/automation-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          processName: form.processName,
          department: form.department,
          roleAffected: form.roleAffected,
          fullyLoadedHourlyCost: Number(form.fullyLoadedHourlyCost),
          baselineTimePerInstance: Number(form.baselineTimePerInstance),
          baselineFrequency: form.baselineFrequency,
          baselineMonthlyHours: Number(form.baselineMonthlyHours),
          baselineMonthlyCost: Number(form.baselineMonthlyCost),
        }),
      })
      if (!res.ok) throw new Error("Create failed")
      toast.success("Automation card created")
      setForm(emptyForm)
      setShowForm(false)
      fetchCards()
    } catch {
      toast.error("Failed to create automation card")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(card: AutomationCard) {
    setEditingId(card.id)
    setEditForm({
      postDeploymentTimePerInstance: card.postDeploymentTimePerInstance ?? 0,
      postDeploymentMonthlyHours: card.postDeploymentMonthlyHours ?? 0,
      hoursFreedPerMonth: card.hoursFreedPerMonth ?? 0,
      dollarValueFreed: card.dollarValueFreed ?? 0,
      automationHealthScore: card.automationHealthScore ?? 0,
      deployedAt: card.deployedAt ? card.deployedAt.split("T")[0] : "",
    })
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/ops-excellence/automation-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postDeploymentTimePerInstance: Number(editForm.postDeploymentTimePerInstance),
          postDeploymentMonthlyHours: Number(editForm.postDeploymentMonthlyHours),
          hoursFreedPerMonth: Number(editForm.hoursFreedPerMonth),
          dollarValueFreed: Number(editForm.dollarValueFreed),
          automationHealthScore: Number(editForm.automationHealthScore),
          deployedAt: editForm.deployedAt ? new Date(editForm.deployedAt).toISOString() : undefined,
        }),
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success("Automation updated")
      setEditingId(null)
      fetchCards()
    } catch {
      toast.error("Failed to update automation")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/ops-excellence/automation-cards/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Automation deleted")
      fetchCards()
    } catch {
      toast.error("Failed to delete automation")
    }
  }

  const cumulative = {
    totalDeployed: cards.filter((c) => c.deployedAt).length,
    totalHoursFreed: cards.reduce((s, c) => s + (c.hoursFreedPerMonth ?? 0), 0),
    totalDollarValue: cards.reduce((s, c) => s + (c.dollarValueFreed ?? 0), 0),
    avgHealth: cards.filter((c) => c.automationHealthScore !== null).length > 0
      ? Math.round(
          cards.filter((c) => c.automationHealthScore !== null)
            .reduce((s, c) => s + (c.automationHealthScore ?? 0), 0) /
          cards.filter((c) => c.automationHealthScore !== null).length
        )
      : 0,
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cumulative Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Deployed</p>
          <p className="text-2xl font-bold text-foreground">{cumulative.totalDeployed}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Hours Freed/mo</p>
          <p className="text-2xl font-bold text-foreground">{cumulative.totalHoursFreed.toFixed(1)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Dollar Value/mo</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(cumulative.totalDollarValue)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Health</p>
          <p className="text-2xl font-bold text-foreground">{cumulative.avgHealth}%</p>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Automation Case Cards</h3>
        <PrimaryButton onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Automation
        </PrimaryButton>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <h4 className="text-sm font-semibold text-foreground mb-4">New Automation Card</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput label="Process Name" value={form.processName} onChange={(v) => setForm({ ...form, processName: v })} required />
            <FormSelect
              label="Department"
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              required
            />
            <FormInput label="Role Affected" value={form.roleAffected} onChange={(v) => setForm({ ...form, roleAffected: v })} required />
            <FormInput label="Hourly Cost ($)" type="number" value={form.fullyLoadedHourlyCost} onChange={(v) => setForm({ ...form, fullyLoadedHourlyCost: Number(v) })} min={0} step={0.01} />
            <FormInput label="Time/Instance (min)" type="number" value={form.baselineTimePerInstance} onChange={(v) => setForm({ ...form, baselineTimePerInstance: Number(v) })} min={0} />
            <FormSelect
              label="Frequency"
              value={form.baselineFrequency}
              onChange={(v) => setForm({ ...form, baselineFrequency: v })}
              options={Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <FormInput label="Baseline Monthly Hours" type="number" value={form.baselineMonthlyHours} onChange={(v) => setForm({ ...form, baselineMonthlyHours: Number(v) })} min={0} step={0.1} />
            <FormInput label="Baseline Monthly Cost ($)" type="number" value={form.baselineMonthlyCost} onChange={(v) => setForm({ ...form, baselineMonthlyCost: Number(v) })} min={0} step={0.01} />
          </div>
          <div className="flex gap-2 mt-4">
            <PrimaryButton onClick={handleCreate} loading={saving}>
              <Save className="h-4 w-4" />
              Create Automation
            </PrimaryButton>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Automation Cards */}
      {cards.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Cpu className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No automation case cards yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const isEditing = editingId === card.id
            const isDeployed = card.deployedAt !== null
            return (
              <Card key={card.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{card.processName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.department} -- {card.roleAffected} -- {formatCurrency(card.fullyLoadedHourlyCost)}/hr
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDeployed && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-900/20">
                        Deployed
                      </span>
                    )}
                    <DangerButton onClick={() => handleDelete(card.id)}>
                      <Trash2 className="h-3.5 w-3.5 inline" />
                    </DangerButton>
                  </div>
                </div>

                {/* Baseline vs Post-deploy */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="border border-border rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Baseline</p>
                    <div className="space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Time/Instance</span>
                        <span className="text-foreground">{card.baselineTimePerInstance}m</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="text-foreground">
                          {FREQUENCY_LABELS[card.baselineFrequency as keyof typeof FREQUENCY_LABELS] ?? card.baselineFrequency}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Hours</span>
                        <span className="text-foreground">{card.baselineMonthlyHours}h</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Cost</span>
                        <span className="text-foreground">{formatCurrency(card.baselineMonthlyCost)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="border border-border rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Post-Deployment</p>
                    {isDeployed && !isEditing ? (
                      <div className="space-y-1 text-xs">
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Hours Freed/mo</span>
                          <span className="text-emerald-400 font-medium">{card.hoursFreedPerMonth ?? "--"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Dollar Value/mo</span>
                          <span className="text-emerald-400 font-medium">
                            {card.dollarValueFreed !== null ? formatCurrency(card.dollarValueFreed) : "--"}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Health Score</span>
                          <span className="text-foreground">{card.automationHealthScore ?? "--"}%</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Deployed</span>
                          <span className="text-foreground">{formatDate(card.deployedAt!)}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not yet deployed</p>
                    )}
                  </div>
                </div>

                {/* Edit Post-Deployment */}
                {!isEditing ? (
                  <div className="mt-3">
                    <button
                      onClick={() => startEdit(card)}
                      className="text-xs text-[#981B1B] hover:text-[#791515] font-medium transition-colors"
                    >
                      Edit Post-Deployment Metrics
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 border border-border rounded-xl p-4">
                    <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Edit Post-Deployment</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <FormInput
                        label="Deploy Date"
                        type="date"
                        value={editForm.deployedAt}
                        onChange={(v) => setEditForm({ ...editForm, deployedAt: v })}
                      />
                      <FormInput
                        label="Post Time/Instance (min)"
                        type="number"
                        value={editForm.postDeploymentTimePerInstance}
                        onChange={(v) => setEditForm({ ...editForm, postDeploymentTimePerInstance: Number(v) })}
                        min={0}
                      />
                      <FormInput
                        label="Post Monthly Hours"
                        type="number"
                        value={editForm.postDeploymentMonthlyHours}
                        onChange={(v) => setEditForm({ ...editForm, postDeploymentMonthlyHours: Number(v) })}
                        min={0}
                        step={0.1}
                      />
                      <FormInput
                        label="Hours Freed/mo"
                        type="number"
                        value={editForm.hoursFreedPerMonth}
                        onChange={(v) => setEditForm({ ...editForm, hoursFreedPerMonth: Number(v) })}
                        min={0}
                        step={0.1}
                      />
                      <FormInput
                        label="Dollar Value Freed/mo ($)"
                        type="number"
                        value={editForm.dollarValueFreed}
                        onChange={(v) => setEditForm({ ...editForm, dollarValueFreed: Number(v) })}
                        min={0}
                        step={0.01}
                      />
                      <FormInput
                        label="Health Score (0-100)"
                        type="number"
                        value={editForm.automationHealthScore}
                        onChange={(v) => setEditForm({ ...editForm, automationHealthScore: Number(v) })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <PrimaryButton onClick={() => handleUpdate(card.id)} loading={saving}>
                        <Save className="h-4 w-4" />
                        Save
                      </PrimaryButton>
                      <button onClick={() => setEditingId(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab 6: Calculate Score ──────────────────────────────────

function ScoreTab({
  engagementId,
  dashboard,
  onRefresh,
}: {
  engagementId: string
  dashboard: DashboardData
  onRefresh: () => void
}) {
  const [calculating, setCalculating] = useState(false)
  const [preview, setPreview] = useState<ScoreRecord | null>(null)

  const [financialData, setFinancialData] = useState({
    revenue: "",
    controllableSGA: "",
    toolCount: "",
    fteCount: "",
    unitEconomicsCalculable: "0",
  })

  const [confidence, setConfidence] = useState({
    systemIntegrationCoverage: 50,
    dataFreshness: 50,
    singleSourceOfTruth: 50,
    dashboardAdoption: 50,
  })

  async function handleCalculate() {
    setCalculating(true)
    try {
      const res = await fetch("/api/ops-excellence/score/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          financialData: {
            revenue: financialData.revenue ? Number(financialData.revenue) : null,
            controllableSGA: financialData.controllableSGA ? Number(financialData.controllableSGA) : null,
            toolCount: financialData.toolCount ? Number(financialData.toolCount) : null,
            fteCount: financialData.fteCount ? Number(financialData.fteCount) : null,
            unitEconomicsCalculable: Number(financialData.unitEconomicsCalculable),
          },
          measurementConfidence: confidence,
        }),
      })
      if (!res.ok) throw new Error("Calculation failed")
      const json = await res.json()
      setPreview(json.data)
      toast.success("Score calculated and saved")
      onRefresh()
    } catch {
      toast.error("Failed to calculate score")
    } finally {
      setCalculating(false)
    }
  }

  function ConfidenceSlider({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
  }) {
    return (
      <label className="block">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
          <span className="text-foreground font-medium">{value}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-[#981B1B]"
        />
      </label>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Data */}
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Financial Data</h3>
          <div className="space-y-4">
            <FormInput
              label="Revenue ($)"
              type="number"
              value={financialData.revenue}
              onChange={(v) => setFinancialData({ ...financialData, revenue: v })}
              placeholder="Annual revenue"
              min={0}
            />
            <FormInput
              label="Controllable SG&A ($)"
              type="number"
              value={financialData.controllableSGA}
              onChange={(v) => setFinancialData({ ...financialData, controllableSGA: v })}
              placeholder="Annual controllable overhead"
              min={0}
            />
            <FormInput
              label="Tool Count"
              type="number"
              value={financialData.toolCount}
              onChange={(v) => setFinancialData({ ...financialData, toolCount: v })}
              placeholder="Number of software tools"
              min={0}
            />
            <FormInput
              label="FTE Count"
              type="number"
              value={financialData.fteCount}
              onChange={(v) => setFinancialData({ ...financialData, fteCount: v })}
              placeholder="Full-time equivalent headcount"
              min={0}
            />
            <FormInput
              label="Unit Economics Calculable (0-4)"
              type="number"
              value={financialData.unitEconomicsCalculable}
              onChange={(v) => setFinancialData({ ...financialData, unitEconomicsCalculable: v })}
              min={0}
              max={4}
            />
          </div>
        </Card>

        {/* Measurement Confidence */}
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Measurement Confidence</h3>
          <div className="space-y-6">
            <ConfidenceSlider
              label="System Integration Coverage"
              value={confidence.systemIntegrationCoverage}
              onChange={(v) => setConfidence({ ...confidence, systemIntegrationCoverage: v })}
            />
            <ConfidenceSlider
              label="Data Freshness"
              value={confidence.dataFreshness}
              onChange={(v) => setConfidence({ ...confidence, dataFreshness: v })}
            />
            <ConfidenceSlider
              label="Single Source of Truth"
              value={confidence.singleSourceOfTruth}
              onChange={(v) => setConfidence({ ...confidence, singleSourceOfTruth: v })}
            />
            <ConfidenceSlider
              label="Dashboard Adoption"
              value={confidence.dashboardAdoption}
              onChange={(v) => setConfidence({ ...confidence, dashboardAdoption: v })}
            />
          </div>
        </Card>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <PrimaryButton onClick={handleCalculate} loading={calculating}>
          <Calculator className="h-4 w-4" />
          Calculate Score
        </PrimaryButton>
      </div>

      {/* Score Preview */}
      {preview && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Score Result (V{preview.version})
          </h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="text-5xl font-bold text-foreground">{preview.compositeScore}</div>
            <div>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                CONFIDENCE_TIERS[preview.confidenceTier as keyof typeof CONFIDENCE_TIERS]?.bgColor,
                CONFIDENCE_TIERS[preview.confidenceTier as keyof typeof CONFIDENCE_TIERS]?.color,
              )}>
                {preview.confidenceTier} ({preview.confidencePercent}%)
              </span>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                {preview.totalHoursFreed !== null && (
                  <span>{preview.totalHoursFreed.toFixed(1)}h freed</span>
                )}
                {preview.totalDollarsSaved !== null && (
                  <span>{formatCurrency(preview.totalDollarsSaved)} saved</span>
                )}
                {preview.automationsDeployed !== null && (
                  <span>{preview.automationsDeployed} automations</span>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
              const val = preview[key as keyof typeof preview]
              return (
                <DimensionBar
                  key={key}
                  label={config.label}
                  value={typeof val === "number" ? val : 0}
                  max={config.maxScore}
                  color={config.color}
                />
              )
            })}
          </div>
        </Card>
      )}

      {/* Score History */}
      {dashboard.latestScore && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Score History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Version</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Composite</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Confidence</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">FC</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">AI</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">CR</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">SE</th>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {[dashboard.latestScore, dashboard.previousScore].filter(Boolean).map((score) => {
                  const s = score!
                  const confTier = CONFIDENCE_TIERS[s.confidenceTier as keyof typeof CONFIDENCE_TIERS]
                  return (
                    <tr key={s.version} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-foreground font-medium">V{s.version}</td>
                      <td className="px-4 py-3 text-right text-foreground font-bold">{s.compositeScore}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", confTier?.bgColor, confTier?.color)}>
                          {s.confidenceTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.financialClarity.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.aiReadiness.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.capacityRoi.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.spendEfficiency.toFixed(1)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(s.calculatedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
