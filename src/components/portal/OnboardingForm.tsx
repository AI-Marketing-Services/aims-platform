"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, CheckCircle } from "lucide-react"

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "url" | "textarea" | "select" | "checkbox" | "file_url"
  placeholder?: string
  required?: boolean
  options?: string[]
  helpText?: string
}

interface OnboardingFormProps {
  subscriptionId: string
  serviceName: string
  fields: FormField[]
  existingData?: Record<string, string>
}

export default function OnboardingForm({
  subscriptionId,
  serviceName,
  fields,
  existingData,
}: OnboardingFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    existingData ?? {}
  )
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, data: formData }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to submit onboarding form")
      }

      setCompleted(true)
      toast.success("Onboarding form submitted successfully")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (completed) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Onboarding Complete
        </h2>
        <p className="text-muted-foreground text-sm">
          Thank you for completing your onboarding for {serviceName}. Our team
          will begin setting up your service right away.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {serviceName} Onboarding
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Please fill out the information below so our team can get your service
          set up.
        </p>

        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-foreground mb-1"
              >
                {field.label}
                {field.required && (
                  <span className="text-[#C4972A] ml-0.5">*</span>
                )}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                />
              ) : field.type === "select" ? (
                <select
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={field.name}
                    checked={formData[field.name] === "true"}
                    onChange={(e) =>
                      handleChange(field.name, e.target.checked ? "true" : "false")
                    }
                    className="h-4 w-4 rounded border-border text-[#C4972A] focus:ring-[#C4972A]"
                  />
                  <span className="text-sm text-muted-foreground">
                    {field.placeholder || "Yes"}
                  </span>
                </div>
              ) : (
                <input
                  type={field.type === "file_url" ? "url" : field.type}
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                />
              )}

              {field.helpText && (
                <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
              )}

              {errors[field.name] && (
                <p className="mt-1 text-xs text-[#C4972A]">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#C4972A] px-5 py-3 text-sm font-medium text-white hover:bg-[#A17D22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Onboarding Form"
        )}
      </button>
    </form>
  )
}
