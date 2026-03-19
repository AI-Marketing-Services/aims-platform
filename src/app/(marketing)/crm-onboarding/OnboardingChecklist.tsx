"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PHASES = [
  {
    title: "Account & Profile",
    timeline: "Day 1",
    items: [
      "Open your welcome email and click the activation link",
      "Create your password and log in",
      "Complete two-factor authentication",
      "Go to Settings > Business Profile and fill in all fields",
      "Go to Settings > Custom Values and update every placeholder with your business info",
    ],
  },
  {
    title: "Calendar & Scheduling",
    timeline: "Day 1-2",
    items: [
      "Navigate to Calendars and activate your pre-built calendar",
      'Rename the calendar with your name (e.g., "Your Name - Consultation")',
      "Set your availability hours and appointment duration",
      "Connect Google Calendar or Outlook for sync",
      "Connect Google Meet or Zoom for automatic meeting links",
      "Test the booking flow from your website",
    ],
  },
  {
    title: "Website & Funnels",
    timeline: "Day 2-3",
    items: [
      "Go to Sites > Websites and browse all 7 templates",
      "Select and duplicate your chosen template",
      "Replace all placeholder text with your business info",
      "Upload your logo (500x500px, PNG or JPG)",
      "Customize colors to match your brand",
      "Preview and save",
    ],
  },
  {
    title: "Automations",
    timeline: "Day 3-4",
    items: [
      "Open the Calendar Booking workflow and assign yourself as active user",
      "Open the Form Submission workflow and assign yourself as active user",
      "Save both workflows",
      "Test with a real submission to verify everything fires",
    ],
  },
  {
    title: "AI Setup",
    timeline: "Day 4-5",
    items: [
      "Go to Settings > Knowledge Base and update all fields with your business details",
      "Go to Conversational AI > Agents and update the agent with your business name",
      "Update Board Training with your business name",
      "Attach your calendar to the chat bot",
      "Add the chat widget to your website",
      'Set the bot as "Primary" in Conversational AI settings',
      "Test the chat widget",
    ],
  },
  {
    title: "Domain & DNS",
    timeline: "Week 1-2",
    items: [
      "Go to Settings > Domains and add your custom domain",
      "Copy the A Record and CNAME values from GHL",
      "Log in to your domain registrar and add both DNS records",
      "Wait for propagation (15 min to 48 hours)",
      "Return to GHL and verify the connection",
      "Enable SSL certificate",
      "Assign your website template to the connected domain",
    ],
  },
  {
    title: "Advanced Setup",
    timeline: "Week 2+",
    items: [
      "Add a custom email domain with SPF, DKIM, and DMARC records",
      "Purchase a phone number if needed",
      "Start A2P 10DLC registration for SMS compliance",
      "Connect reputation management (Google Business, Facebook, Yelp)",
      "Connect Stripe for payments if applicable",
      "Configure Voice AI (Route Owners & Vending Empires only)",
    ],
  },
]

const STORAGE_KEY = "aims-crm-onboarding-checklist"

export function OnboardingChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setChecked(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  function toggle(key: string) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const totalItems = PHASES.reduce((s, p) => s + p.items.length, 0)
  const completedItems = Object.values(checked).filter(Boolean).length
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {completedItems} of {totalItems} tasks complete
          </span>
          <span className="text-sm font-bold text-[#DC2626]">{progressPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#DC2626] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {PHASES.map((phase, pi) => {
          const phaseComplete = phase.items.every((_, ii) => checked[`${pi}-${ii}`])
          return (
            <div
              key={pi}
              className={cn(
                "rounded-xl border bg-white overflow-hidden transition-colors",
                phaseComplete ? "border-green-200" : "border-gray-200"
              )}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                      phaseComplete
                        ? "bg-green-50 text-green-600"
                        : "bg-[#DC2626]/10 text-[#DC2626]"
                    )}
                  >
                    {phaseComplete ? <Check className="h-4 w-4" /> : pi + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{phase.title}</h3>
                    <p className="text-xs text-muted-foreground">{phase.timeline}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {phase.items.filter((_, ii) => checked[`${pi}-${ii}`]).length}/{phase.items.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {phase.items.map((item, ii) => {
                  const key = `${pi}-${ii}`
                  const done = !!checked[key]
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                          done
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {done && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          done ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
