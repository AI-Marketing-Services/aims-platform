"use client"

import { CalendarCheck, Upload, ArrowRight } from "lucide-react"
import type { IntakeScheduleData } from "@/lib/ops-excellence/types"

interface StepScheduleProps {
  data: IntakeScheduleData
  onChange: (data: IntakeScheduleData) => void
}

const labelClass = "block text-sm font-medium text-foreground mb-1.5"
const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"

export function StepSchedule({ data, onChange }: StepScheduleProps) {
  function updateField<K extends keyof IntakeScheduleData>(
    key: K,
    value: IntakeScheduleData[K]
  ) {
    onChange({ ...data, [key]: value })
  }

  function addFileUrl(url: string) {
    if (!url.trim()) return
    updateField("fileUrls", [...data.fileUrls, url.trim()])
  }

  function removeFileUrl(index: number) {
    updateField(
      "fileUrls",
      data.fileUrls.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="space-y-5">
      {/* Preferred Call Time */}
      <div>
        <label htmlFor="preferredCallTime" className={labelClass}>
          When works best for a 30-minute discovery call?
        </label>
        <textarea
          id="preferredCallTime"
          rows={3}
          className={inputClass}
          placeholder="e.g. Weekday mornings EST, Tuesdays and Thursdays after 2pm..."
          value={data.preferredCallTime}
          onChange={(e) => updateField("preferredCallTime", e.target.value)}
        />
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="additionalNotes" className={labelClass}>
          Anything else we should know?
        </label>
        <textarea
          id="additionalNotes"
          rows={4}
          className={inputClass}
          placeholder="Share any additional context about your situation, goals, or constraints..."
          value={data.additionalNotes}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
        />
      </div>

      {/* File Links */}
      <div>
        <p className={labelClass}>Supporting Documents</p>
        <p className="text-xs text-muted-foreground mb-3">
          Share links to Google Drive, Dropbox, or other file-sharing services with
          relevant documents (org charts, P&amp;Ls, tool inventories, etc.).
        </p>

        <div className="rounded-xl border-2 border-dashed border-border bg-panel p-5 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Paste a link to your shared files
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const input = e.currentTarget
                  addFileUrl(input.value)
                  input.value = ""
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = (e.currentTarget as HTMLButtonElement)
                  .previousElementSibling as HTMLInputElement
                addFileUrl(input.value)
                input.value = ""
              }}
              className="shrink-0 rounded-lg bg-panel border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* File URL List */}
        {data.fileUrls.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.fileUrls.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-xs text-foreground truncate flex-1">{url}</span>
                <button
                  type="button"
                  onClick={() => removeFileUrl(idx)}
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What Happens Next */}
      <div className="rounded-2xl border border-[#C4972A]/20 bg-[#C4972A]/5 p-5">
        <div className="flex items-start gap-3">
          <CalendarCheck className="h-5 w-5 shrink-0 text-[#C4972A] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">What happens next</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#C4972A]" />
                We review your responses and prepare a preliminary assessment.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#C4972A]" />
                We confirm your discovery call within 24 hours.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#C4972A]" />
                On the call, we walk through your CFO Test results and discuss the engagement plan.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
