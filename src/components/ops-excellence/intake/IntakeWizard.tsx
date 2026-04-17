"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ChevronLeft, ChevronRight, Send, Check } from "lucide-react"
import { toast } from "sonner"
import { INTAKE_STEPS } from "@/lib/ops-excellence/config"
import type {
  IntakeCompanyData,
  IntakeLeadershipData,
  IntakeCFOData,
  IntakeTechnologyData,
  IntakeScheduleData,
  FullIntakeData,
} from "@/lib/ops-excellence/types"
import { StepCompanyProfile } from "./StepCompanyProfile"
import { StepLeadershipGoals } from "./StepLeadershipGoals"
import { StepCFOTest } from "./StepCFOTest"
import { StepTechnology } from "./StepTechnology"
import { StepSchedule } from "./StepSchedule"

// ── Constants ───────────────────────────────────────────────

const STORAGE_KEY = "aims-ops-intake-draft"

const EMPTY_DATA: FullIntakeData = {
  company: {
    companyName: "",
    industry: "",
    website: "",
    annualRevenue: "",
    employeeCount: "",
    businessModel: "",
    locationCount: "",
  },
  leadership: {
    ceoName: "",
    ceoEmail: "",
    ceoPhone: "",
    integratorName: "",
    integratorEmail: "",
    financeLeadName: "",
    financeLeadEmail: "",
    painPoints: [],
    successVision: "",
    operatingSystem: "",
  },
  cfoTest: {
    responses: [],
  },
  technology: {
    currentTools: [],
    otherTools: "",
    toolCount: "",
    dataMaturit: "",
    aiUsage: "",
  },
  schedule: {
    preferredCallTime: "",
    additionalNotes: "",
    fileUrls: [],
  },
}

// ── localStorage helpers ────────────────────────────────────

function loadDraft(): FullIntakeData {
  if (typeof window === "undefined") return EMPTY_DATA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    return JSON.parse(raw) as FullIntakeData
  } catch {
    return EMPTY_DATA
  }
}

function saveDraft(data: FullIntakeData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full or disabled
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}

// ── Animation config ────────────────────────────────────────

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
  }),
}

// ── Validation ──────────────────────────────────────────────

type CompanyErrors = Partial<Record<keyof IntakeCompanyData, string>>
type LeadershipErrors = Partial<Record<keyof IntakeLeadershipData, string>>

function validateCompany(data: IntakeCompanyData): CompanyErrors {
  const errors: CompanyErrors = {}
  if (!data.companyName.trim()) errors.companyName = "Company name is required"
  if (!data.industry.trim()) errors.industry = "Industry is required"
  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.website = "Enter a valid URL starting with http:// or https://"
  }
  return errors
}

function validateLeadership(data: IntakeLeadershipData): LeadershipErrors {
  const errors: LeadershipErrors = {}
  if (!data.ceoName.trim()) errors.ceoName = "Name is required"
  if (!data.ceoEmail.trim()) {
    errors.ceoEmail = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ceoEmail)) {
    errors.ceoEmail = "Enter a valid email address"
  }
  if (!data.ceoPhone.trim()) errors.ceoPhone = "Phone number is required"
  return errors
}

function validateCFOTest(data: IntakeCFOData): string | null {
  if (data.responses.length < 7) {
    return `Please answer all 7 questions (${data.responses.length}/7 answered)`
  }
  return null
}

// ── Main Component ──────────────────────────────────────────

export default function IntakeWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [formData, setFormData] = useState<FullIntakeData>(EMPTY_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({})
  const [leadershipErrors, setLeadershipErrors] = useState<LeadershipErrors>({})
  const [cfoError, setCfoError] = useState<string | null>(null)

  // Hydrate from localStorage
  useEffect(() => {
    setFormData(loadDraft())
    setHydrated(true)
  }, [])

  // Auto-save on every change after hydration
  useEffect(() => {
    if (hydrated) {
      saveDraft(formData)
    }
  }, [formData, hydrated])

  // ── Step data updaters ──────────────────────────────────

  const updateCompany = useCallback(
    (data: IntakeCompanyData) => {
      setFormData((prev) => ({ ...prev, company: data }))
      if (Object.keys(companyErrors).length > 0) {
        setCompanyErrors(validateCompany(data))
      }
    },
    [companyErrors]
  )

  const updateLeadership = useCallback(
    (data: IntakeLeadershipData) => {
      setFormData((prev) => ({ ...prev, leadership: data }))
      if (Object.keys(leadershipErrors).length > 0) {
        setLeadershipErrors(validateLeadership(data))
      }
    },
    [leadershipErrors]
  )

  const updateCFO = useCallback(
    (data: IntakeCFOData) => {
      setFormData((prev) => ({ ...prev, cfoTest: data }))
      if (cfoError) {
        setCfoError(validateCFOTest(data))
      }
    },
    [cfoError]
  )

  const updateTechnology = useCallback(
    (data: IntakeTechnologyData) => {
      setFormData((prev) => ({ ...prev, technology: data }))
    },
    []
  )

  const updateSchedule = useCallback(
    (data: IntakeScheduleData) => {
      setFormData((prev) => ({ ...prev, schedule: data }))
    },
    []
  )

  // ── Validation ──────────────────────────────────────────

  function validateCurrentStep(): boolean {
    if (currentStep === 0) {
      const errors = validateCompany(formData.company)
      setCompanyErrors(errors)
      return Object.keys(errors).length === 0
    }
    if (currentStep === 1) {
      const errors = validateLeadership(formData.leadership)
      setLeadershipErrors(errors)
      return Object.keys(errors).length === 0
    }
    if (currentStep === 2) {
      const err = validateCFOTest(formData.cfoTest)
      setCfoError(err)
      return err === null
    }
    return true
  }

  // ── Navigation ──────────────────────────────────────────

  function goNext() {
    if (!validateCurrentStep()) return
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, INTAKE_STEPS.length - 1))
  }

  function goBack() {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  // ── Submit ──────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateCurrentStep()) return

    setSubmitting(true)
    try {
      const employeeCountNum = formData.company.employeeCount
        ? parseInt(
            formData.company.employeeCount.split("-")[0].replace("+", ""),
            10
          ) || undefined
        : undefined

      const cfoResponses = formData.cfoTest.responses
      const greenCount = cfoResponses.filter((r) => r.score === "GREEN").length
      const yellowCount = cfoResponses.filter((r) => r.score === "YELLOW").length
      const redCount = cfoResponses.filter((r) => r.score === "RED").length

      const payload = {
        companyName: formData.company.companyName,
        industry: formData.company.industry || undefined,
        annualRevenue: formData.company.annualRevenue || undefined,
        employeeCount: employeeCountNum,
        website: formData.company.website || undefined,
        intakeData: {
          company: {
            businessModel: formData.company.businessModel,
            locationCount: formData.company.locationCount,
          },
          leadership: {
            ceoName: formData.leadership.ceoName,
            ceoEmail: formData.leadership.ceoEmail,
            ceoPhone: formData.leadership.ceoPhone,
            integratorName: formData.leadership.integratorName,
            integratorEmail: formData.leadership.integratorEmail,
            financeLeadName: formData.leadership.financeLeadName,
            financeLeadEmail: formData.leadership.financeLeadEmail,
            painPoints: formData.leadership.painPoints,
            successVision: formData.leadership.successVision,
            operatingSystem: formData.leadership.operatingSystem,
          },
          cfoTest: {
            responses: Object.fromEntries(
              cfoResponses.map((r) => [r.questionId, r.score])
            ),
            greenCount,
            yellowCount,
            redCount,
          },
          technology: {
            currentTools: formData.technology.currentTools,
            otherTools: formData.technology.otherTools,
            toolCount: formData.technology.toolCount,
            dataMaturity: formData.technology.dataMaturit,
            aiUsage: formData.technology.aiUsage,
          },
          schedule: {
            preferredCallTime: formData.schedule.preferredCallTime,
            additionalNotes: formData.schedule.additionalNotes,
            fileUrls: formData.schedule.fileUrls,
          },
        },
      }

      const res = await fetch("/api/ops-excellence/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to submit intake form")
      }

      clearDraft()
      toast.success(
        "Intake submitted successfully. We will be in touch within 24 hours."
      )
      router.push("/portal/ops-excellence")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────

  const isLastStep = currentStep === INTAKE_STEPS.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="space-y-6">
      {/* ── Progress Bar ── */}
      <nav className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          {INTAKE_STEPS.map((step, idx) => {
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep

            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isCompleted
                        ? "bg-[#981B1B] text-white"
                        : isActive
                          ? "bg-[#981B1B]/15 text-[#981B1B] ring-2 ring-[#981B1B]/30"
                          : "bg-panel text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-medium text-center hidden sm:block ${
                      isActive
                        ? "text-[#981B1B]"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {idx < INTAKE_STEPS.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-3">
                    <div
                      className={`h-0.5 rounded-full transition-colors ${
                        idx < currentStep ? "bg-[#981B1B]" : "bg-border"
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Step Content ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {INTAKE_STEPS[currentStep].title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {INTAKE_STEPS[currentStep].description}
              </p>
            </div>

            {currentStep === 0 && (
              <StepCompanyProfile
                data={formData.company}
                onChange={updateCompany}
                errors={companyErrors}
              />
            )}
            {currentStep === 1 && (
              <StepLeadershipGoals
                data={formData.leadership}
                onChange={updateLeadership}
                errors={leadershipErrors}
              />
            )}
            {currentStep === 2 && (
              <>
                <StepCFOTest
                  data={formData.cfoTest}
                  onChange={updateCFO}
                />
                {cfoError && (
                  <p className="mt-3 text-xs text-red-400">{cfoError}</p>
                )}
              </>
            )}
            {currentStep === 3 && (
              <StepTechnology
                data={formData.technology}
                onChange={updateTechnology}
              />
            )}
            {currentStep === 4 && (
              <StepSchedule
                data={formData.schedule}
                onChange={updateSchedule}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep}
          className={`flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors ${
            isFirstStep
              ? "opacity-0 pointer-events-none"
              : "bg-surface text-foreground hover:bg-panel"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[#981B1B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#791515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Intake
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-lg bg-[#981B1B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#791515] transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
