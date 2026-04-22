/**
 * Close -> AIMS sync engine.
 *
 * Pulls all leads from Close where BTC Business Line = "AI Operator
 * Collective (AOC)" and upserts them into our Deal table. Skips
 * anything that isn't AOC-tagged so vending/BK workspace data never
 * leaks into our CRM.
 *
 * Runs in two modes:
 *  - Full: pages through the entire AOC partition (admin on-demand)
 *  - Incremental: only pulls leads updated since `since` (cron)
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  listAOCLeads,
  listLeadOpportunities,
  primaryEmail,
  primaryName,
  closeStatusToAimsStage,
  isAOCLead,
  type CloseLead,
  type CloseOpportunity,
} from "@/lib/close"

export interface CloseSyncResult {
  total: number
  created: number
  updated: number
  skipped: number
  errors: number
  errorDetails: Array<{ closeLeadId: string; reason: string }>
  totalOpportunityValue: number
  wonOpportunityCount: number
}

export async function runCloseSync(options?: {
  since?: Date
  includeOpportunities?: boolean
}): Promise<CloseSyncResult> {
  const result: CloseSyncResult = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    totalOpportunityValue: 0,
    wonOpportunityCount: 0,
  }

  const leads = await listAOCLeads({ dateUpdatedAfter: options?.since })
  result.total = leads.length

  for (const lead of leads) {
    // Belt-and-suspenders. listAOCLeads already filters on creation-date
    // floor, but run it again here so any future code path that hands us
    // a lead directly can't smuggle in a legacy Vendingpreneurs record.
    if (!isAOCLead(lead)) {
      result.skipped++
      continue
    }
    try {
      const action = await upsertDealFromCloseLead(lead, {
        includeOpportunities: options?.includeOpportunities ?? true,
      })
      if (action.opportunityTotal > 0) {
        result.totalOpportunityValue += action.opportunityTotal
      }
      result.wonOpportunityCount += action.wonCount
      if (action.outcome === "created") result.created++
      else if (action.outcome === "updated") result.updated++
      else result.skipped++
    } catch (err) {
      result.errors++
      const reason = err instanceof Error ? err.message : "Unknown error"
      result.errorDetails.push({ closeLeadId: lead.id, reason })
      logger.error(`Close sync failed for lead ${lead.id}`, err, {
        action: "close_sync_lead",
      })
    }
  }

  return result
}

/**
 * Upsert a single AOC-tagged Close lead into our Deal table. Matches
 * by `Deal.closeLeadId` first, then by contact email, then creates a
 * new Deal. Preserves the AIMS-side stage when the applicant hasn't
 * been updated on the Close side since the AIMS update.
 */
async function upsertDealFromCloseLead(
  lead: CloseLead,
  options: { includeOpportunities: boolean }
): Promise<{
  outcome: "created" | "updated" | "skipped"
  dealId?: string
  opportunityTotal: number
  wonCount: number
}> {
  const email = primaryEmail(lead)
  const name = primaryName(lead)

  if (!email) {
    return { outcome: "skipped", opportunityTotal: 0, wonCount: 0 }
  }

  // Pull opportunities for revenue tracking.
  let opportunities: CloseOpportunity[] = []
  let opportunityTotal = 0
  let wonCount = 0
  if (options.includeOpportunities) {
    opportunities = await listLeadOpportunities(lead.id)
    for (const opp of opportunities) {
      // Close returns opportunity `value` in cents. Normalise to dollars.
      const dollars = (opp.value ?? 0) / 100
      if (opp.date_won) {
        wonCount++
        opportunityTotal += dollars
      }
    }
  }

  const mappedStage = closeStatusToAimsStage({
    statusId: lead.status_id ?? null,
    statusLabel: lead.status_label ?? null,
  })

  const contactPhone = lead.contacts?.[0]?.phones?.[0]?.phone ?? null

  // Try to find an existing deal by closeLeadId OR email.
  const existing =
    (await db.deal.findUnique({ where: { closeLeadId: lead.id } })) ??
    (await db.deal.findFirst({
      where: { contactEmail: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    }))

  if (existing) {
    // Only bump stage forward, never backward. The AIMS-side CRM is
    // the source of truth for "how far along is this applicant" once
    // the admin has taken manual action (e.g. sent Mighty invite).
    const currentStageOrder: Record<string, number> = {
      APPLICATION_SUBMITTED: 0,
      CONSULT_BOOKED: 1,
      CONSULT_COMPLETED: 2,
      MIGHTY_INVITED: 3,
      MEMBER_JOINED: 4,
      LOST: -1, // terminal — handle separately
    }
    const existingOrder = currentStageOrder[existing.stage] ?? 0
    const mappedOrder = mappedStage ? currentStageOrder[mappedStage] ?? 0 : 0

    const nextStage =
      mappedStage === "LOST"
        ? "LOST" // always honour a "Lost" signal from Close
        : mappedStage && mappedOrder > existingOrder
        ? mappedStage
        : existing.stage

    await db.deal.update({
      where: { id: existing.id },
      data: {
        closeLeadId: lead.id,
        contactName: name,
        phone: contactPhone ?? existing.phone,
        mrr: wonCount > 0 ? opportunityTotal : existing.mrr,
        value: wonCount > 0 ? opportunityTotal : existing.value,
        stage: nextStage as typeof existing.stage,
        activities: {
          create: {
            type: "STAGE_CHANGE",
            detail: `Close sync: status "${lead.status_label ?? "?"}" -> ${nextStage}. ${wonCount} won opp(s), $${opportunityTotal.toFixed(2)} total.`,
            metadata: {
              source: "close_sync",
              closeLeadId: lead.id,
              closeStatusId: lead.status_id,
              closeStatusLabel: lead.status_label,
              opportunityCount: opportunities.length,
              wonCount,
              opportunityTotal,
            },
          },
        },
      },
    })
    return { outcome: "updated", dealId: existing.id, opportunityTotal, wonCount }
  }

  // Fresh deal from Close — the applicant originated outside the
  // /apply funnel (e.g. manually added in Close by sales).
  const created = await db.deal.create({
    data: {
      contactName: name,
      contactEmail: email,
      phone: contactPhone,
      source: "close-import",
      sourceDetail: `Imported from Close. Status: ${lead.status_label ?? "?"}.`,
      channelTag: "close",
      value: wonCount > 0 ? opportunityTotal : 0,
      mrr: wonCount > 0 ? opportunityTotal : 0,
      stage: (mappedStage ?? "APPLICATION_SUBMITTED") as "APPLICATION_SUBMITTED",
      closeLeadId: lead.id,
      activities: {
        create: {
          type: "FORM_SUBMITTED",
          detail: `Imported from Close (${lead.status_label ?? "?"}). Applicant was not in AIMS yet.`,
          metadata: {
            source: "close_sync",
            closeLeadId: lead.id,
            closeStatusId: lead.status_id,
            closeStatusLabel: lead.status_label,
            opportunityCount: opportunities.length,
            wonCount,
            opportunityTotal,
          },
        },
      },
    },
  })

  return { outcome: "created", dealId: created.id, opportunityTotal, wonCount }
}
