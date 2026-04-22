"use client"

import { useState } from "react"
import { Copy, Check, Plus, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface LineItem {
  id: string
  name: string
  type: "setup" | "monthly" | "hourly" | "per_unit"
  quantity: number
  unitPrice: number
  description: string
}

const TYPE_LABELS: Record<string, string> = {
  setup: "One-time setup",
  monthly: "Monthly retainer",
  hourly: "Per hour",
  per_unit: "Per unit/seat",
}

const TEMPLATES = [
  {
    name: "AI Receptionist",
    items: [
      { name: "Setup & Configuration", type: "setup" as const, quantity: 1, unitPrice: 1500, description: "Vapi voice agent, call routing, scheduling integration" },
      { name: "Monthly Management & Hosting", type: "monthly" as const, quantity: 1, unitPrice: 400, description: "Ongoing maintenance, monitoring, updates" },
      { name: "Call Handling (first 500 calls)", type: "monthly" as const, quantity: 1, unitPrice: 300, description: "Included in base; overage billed per call" },
    ],
  },
  {
    name: "Automated Review System",
    items: [
      { name: "Setup & Integration", type: "setup" as const, quantity: 1, unitPrice: 500, description: "Connect to POS/CRM, build SMS/email sequences" },
      { name: "Monthly Management", type: "monthly" as const, quantity: 1, unitPrice: 200, description: "Monitor performance, A/B test messages" },
    ],
  },
  {
    name: "Cold Outreach Campaign",
    items: [
      { name: "Campaign Setup", type: "setup" as const, quantity: 1, unitPrice: 800, description: "Copy, sequences, inbox warm-up, list build" },
      { name: "Monthly Management", type: "monthly" as const, quantity: 1, unitPrice: 600, description: "Manage responses, optimize deliverability" },
      { name: "Lead List (per 1,000 contacts)", type: "per_unit" as const, quantity: 1, unitPrice: 200, description: "Verified email leads for target niche + city" },
    ],
  },
  {
    name: "AI Chatbot + Lead Capture",
    items: [
      { name: "Build & Deploy", type: "setup" as const, quantity: 1, unitPrice: 2000, description: "Custom bot, knowledge base, CRM integration, website embed" },
      { name: "Monthly Retainer", type: "monthly" as const, quantity: 1, unitPrice: 500, description: "Maintenance, training, conversation review" },
    ],
  },
  {
    name: "Workflow Automation",
    items: [
      { name: "Discovery & Scoping", type: "hourly" as const, quantity: 3, unitPrice: 150, description: "Document current process, identify automations" },
      { name: "Build & Test", type: "hourly" as const, quantity: 10, unitPrice: 150, description: "Make/n8n workflow construction and testing" },
      { name: "Monthly Monitoring", type: "monthly" as const, quantity: 1, unitPrice: 300, description: "Error monitoring, updates, minor adjustments" },
    ],
  },
]

function genId() {
  return Math.random().toString(36).slice(2)
}

function blankItem(): LineItem {
  return { id: genId(), name: "", type: "monthly", quantity: 1, unitPrice: 0, description: "" }
}

export function PricingCalculator() {
  const [items, setItems] = useState<LineItem[]>([blankItem()])
  const [clientName, setClientName] = useState("")
  const [margin, setMargin] = useState(30)
  const [copied, setCopied] = useState(false)

  const setupTotal = items
    .filter((i) => i.type === "setup")
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const monthlyTotal = items
    .filter((i) => i.type !== "setup")
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const setupWithMargin = Math.round(setupTotal * (1 + margin / 100))
  const monthlyWithMargin = Math.round(monthlyTotal * (1 + margin / 100))

  function addItem() {
    setItems((prev) => [...prev, blankItem()])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  function loadTemplate(name: string) {
    const tpl = TEMPLATES.find((t) => t.name === name)
    if (!tpl) return
    setItems(tpl.items.map((item) => ({ ...item, id: genId() })))
  }

  async function copyMarkdown() {
    const lines = [
      `# Proposal: ${clientName || "Client"} — AI Services`,
      "",
      "## Investment",
      "",
    ]

    if (setupWithMargin > 0) {
      lines.push(`**One-time Setup: $${setupWithMargin.toLocaleString()}**`, "")
      items
        .filter((i) => i.type === "setup")
        .forEach((i) => {
          lines.push(`- ${i.name}: $${(i.quantity * i.unitPrice * (1 + margin / 100)).toFixed(0)}`)
          if (i.description) lines.push(`  *(${i.description})*`)
        })
      lines.push("")
    }

    if (monthlyWithMargin > 0) {
      lines.push(`**Monthly Retainer: $${monthlyWithMargin.toLocaleString()}/mo**`, "")
      items
        .filter((i) => i.type !== "setup")
        .forEach((i) => {
          const label = TYPE_LABELS[i.type] ?? i.type
          lines.push(`- ${i.name} (${label}): $${(i.quantity * i.unitPrice * (1 + margin / 100)).toFixed(0)}`)
          if (i.description) lines.push(`  *(${i.description})*`)
        })
      lines.push("")
    }

    lines.push("---")
    lines.push("*Prices subject to final scoping. Valid for 30 days.*")

    await navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = "h-8 px-2 rounded bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Templates */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Load a template
        </p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => loadTemplate(t.name)}
              className="px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border bg-surface/30 hover:bg-surface transition-all"
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={() => setItems([blankItem()])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border bg-surface/30 hover:bg-surface transition-all"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Line items */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Client name (optional)</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme HVAC"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_24px] gap-2 px-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Item</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Qty</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unit price</p>
            <div />
          </div>

          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_24px] gap-2 items-center">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="e.g. AI Receptionist Setup"
                  className={cn(inputClass, "w-full")}
                />
                <select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, "type", e.target.value)}
                  className={cn(inputClass, "w-full")}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                  className={cn(inputClass, "w-full")}
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className={cn(inputClass, "w-full pl-5")}
                  />
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                placeholder="Description (optional)"
                className={cn(inputClass, "w-full text-muted-foreground")}
              />
            </div>
          ))}

          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line item
          </button>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-3">
          {/* Margin slider */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margin</p>
              <p className="text-sm font-bold text-primary">{margin}%</p>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your price</p>

            {setupWithMargin > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground">One-time setup</p>
                <p className="text-xl font-bold text-foreground">${setupWithMargin.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground/50">
                  Cost: ${setupTotal.toLocaleString()} · Margin: ${(setupWithMargin - setupTotal).toLocaleString()}
                </p>
              </div>
            )}

            {monthlyWithMargin > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground">Monthly retainer</p>
                <p className="text-xl font-bold text-emerald-400">${monthlyWithMargin.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                <p className="text-[10px] text-muted-foreground/50">
                  Cost: ${monthlyTotal.toLocaleString()} · Margin: ${(monthlyWithMargin - monthlyTotal).toLocaleString()}
                </p>
              </div>
            )}

            {setupWithMargin === 0 && monthlyWithMargin === 0 && (
              <p className="text-sm text-muted-foreground/50">Add line items to see your price</p>
            )}
          </div>

          {/* Annual */}
          {monthlyWithMargin > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Annual contract value</p>
              <p className="text-lg font-bold text-emerald-400">
                ${(setupWithMargin + monthlyWithMargin * 12).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Setup + 12 months at ${monthlyWithMargin.toLocaleString()}/mo
              </p>
            </div>
          )}

          {/* Copy to clipboard */}
          <button
            onClick={copyMarkdown}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy for proposal"}
          </button>
        </div>
      </div>
    </div>
  )
}
