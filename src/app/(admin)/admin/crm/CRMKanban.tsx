"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, MoreHorizontal, DollarSign, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type DealStage =
  | "NEW_LEAD"
  | "QUALIFIED"
  | "DEMO_BOOKED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "ACTIVE_CLIENT"

type Deal = {
  id: string
  contactName: string
  company?: string
  stage: DealStage
  value: number
  mrr: number
  source?: string
  serviceArms: string[]
  daysInStage: number
}

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "NEW_LEAD", label: "New Lead", color: "border-gray-500" },
  { key: "QUALIFIED", label: "Qualified", color: "border-blue-500" },
  { key: "DEMO_BOOKED", label: "Demo Booked", color: "border-purple-500" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent", color: "border-yellow-500" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-orange-500" },
  { key: "ACTIVE_CLIENT", label: "Active Client", color: "border-green-500" },
]

const DEMO_DEALS: Deal[] = [
  { id: "d1", contactName: "Sarah Chen", company: "TechFlow Inc", stage: "NEW_LEAD", value: 2964, mrr: 297, source: "ai-readiness-quiz", serviceArms: ["Cold Outbound"], daysInStage: 1 },
  { id: "d2", contactName: "Marcus Johnson", company: "AutoMax Detroit", stage: "NEW_LEAD", value: 5964, mrr: 597, source: "direct", serviceArms: ["Website + CRM", "Voice Agents"], daysInStage: 3 },
  { id: "d3", contactName: "Rachel Torres", company: "Vend Co LLC", stage: "QUALIFIED", value: 1164, mrr: 97, source: "referral", serviceArms: ["Starter Bundle"], daysInStage: 2 },
  { id: "d4", contactName: "Devon Park", company: "Park Hotels Group", stage: "QUALIFIED", value: 3564, mrr: 297, source: "roi-calculator", serviceArms: ["Full Stack"], daysInStage: 5 },
  { id: "d5", contactName: "Angela Reeves", company: "Reeves Dental", stage: "DEMO_BOOKED", value: 2364, mrr: 197, source: "direct", serviceArms: ["SEO + AEO", "Chatbot"], daysInStage: 1 },
  { id: "d6", contactName: "James Wu", company: "WuTech Solutions", stage: "PROPOSAL_SENT", value: 4764, mrr: 397, source: "reseller", serviceArms: ["Elite Bundle"], daysInStage: 4 },
  { id: "d7", contactName: "Kira Nolan", company: "Nolan Fitness", stage: "NEGOTIATION", value: 2364, mrr: 197, source: "direct", serviceArms: ["Cold Outbound", "Audience"], daysInStage: 8 },
  { id: "d8", contactName: "Bill Santos", company: "Santos Auto Group", stage: "ACTIVE_CLIENT", value: 3564, mrr: 297, source: "direct", serviceArms: ["Pro Bundle"], daysInStage: 47 },
  { id: "d9", contactName: "Mia Hoffman", company: "Hoffman & Co", stage: "ACTIVE_CLIENT", value: 5964, mrr: 497, source: "partner", serviceArms: ["Elite Bundle"], daysInStage: 62 },
]

function DealCard({ deal }: { deal: Deal }) {
  const isStale = deal.daysInStage > 5 && deal.stage !== "ACTIVE_CLIENT"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1C1F2A] border border-white/5 rounded-xl p-4 hover:border-white/15 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-medium text-sm">{deal.contactName}</div>
          {deal.company && <div className="text-gray-500 text-xs">{deal.company}</div>}
        </div>
        <button className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          ${deal.mrr}/mo
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className={cn(isStale ? "text-orange-400" : "")}>
            {deal.daysInStage}d
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {deal.serviceArms.slice(0, 2).map((arm) => (
          <span
            key={arm}
            className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md"
          >
            {arm}
          </span>
        ))}
        {deal.serviceArms.length > 2 && (
          <span className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md">
            +{deal.serviceArms.length - 2}
          </span>
        )}
      </div>

      {deal.source && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
          <User className="w-3 h-3" />
          {deal.source}
        </div>
      )}
    </motion.div>
  )
}

export function CRMKanban() {
  const [deals, setDeals] = useState<Deal[]>(DEMO_DEALS)

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-4 h-full pb-4" style={{ minWidth: `${STAGES.length * 260}px` }}>
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key)
          const stageMRR = stageDeals.reduce((sum, d) => sum + d.mrr, 0)

          return (
            <div
              key={stage.key}
              className="flex flex-col w-60 flex-shrink-0"
            >
              {/* Column header */}
              <div className={cn("border-t-2 pt-3 mb-3", stage.color)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{stage.label}</span>
                  <span className="text-xs text-gray-500">{stageDeals.length}</span>
                </div>
                {stageMRR > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">${stageMRR}/mo</div>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                <button className="w-full flex items-center gap-2 py-2.5 px-3 text-gray-600 hover:text-gray-400 text-sm transition-colors rounded-xl hover:bg-white/3 border border-dashed border-white/5 hover:border-white/10">
                  <Plus className="w-3.5 h-3.5" />
                  Add deal
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
