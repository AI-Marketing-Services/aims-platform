/**
 * Universal event emitter — single source of truth for "something
 * happened" across the platform. Every meaningful action writes a row
 * to OperatorEvent so downstream features (Today dashboard, daily
 * digest, activity timelines, attribution, cohort analytics) all read
 * from one place.
 *
 * USAGE:
 *   await emitEvent({
 *     actorId: dbUserId,
 *     type: EVENT_TYPES.DEAL_ENRICHED,
 *     entityType: "ClientDeal",
 *     entityId: dealId,
 *     metadata: { contactsAdded: 4, creditsCost: 47 },
 *   })
 *
 * Failures NEVER bubble to the caller — the event log is observability,
 * not business logic. A dropped event is preferable to a broken request.
 */
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const EVENT_TYPES = {
  // ── Deal lifecycle (CRM) ─────────────────────────────────────────
  DEAL_CREATED: "deal_created",
  DEAL_UPDATED: "deal_updated",
  DEAL_STAGE_ADVANCED: "deal_stage_advanced",
  DEAL_WON: "deal_won",
  DEAL_LOST: "deal_lost",
  DEAL_ENRICHED: "deal_enriched",
  DEAL_NOTE_ADDED: "deal_note_added",
  CONTACT_ADDED: "contact_added",

  // ── Audit funnel (operator's own audits) ────────────────────────
  AUDIT_CREATED: "audit_created",
  AUDIT_PUBLISHED: "audit_published",
  AUDIT_LINK_SHARED: "audit_link_shared",
  AUDIT_STARTED: "audit_started", // visitor begins the quiz
  AUDIT_COMPLETED: "audit_completed", // visitor submits

  // ── Lead-magnet / public tools ──────────────────────────────────
  LEAD_MAGNET_SUBMITTED: "lead_magnet_submitted",

  // ── Playbooks ────────────────────────────────────────────────────
  PLAYBOOK_VIEWED: "playbook_viewed",
  PLAYBOOK_USED: "playbook_used",
  PLAYBOOK_SHARED: "playbook_shared",

  // ── Proposals + invoices ─────────────────────────────────────────
  PROPOSAL_CREATED: "proposal_created",
  PROPOSAL_SENT: "proposal_sent",
  PROPOSAL_ACCEPTED: "proposal_accepted",
  INVOICE_SENT: "invoice_sent",
  INVOICE_PAID: "invoice_paid",

  // ── Whitelabel / reseller ────────────────────────────────────────
  RESELLER_SITE_PUBLISHED: "reseller_site_published",
  WHITELABEL_LEAD_CAPTURED: "whitelabel_lead_captured",

  // ── Commerce ─────────────────────────────────────────────────────
  COMMISSION_EARNED: "commission_earned",
  COMMISSION_PAID: "commission_paid",
  PURCHASE_MADE: "purchase_made",

  // ── Credits ──────────────────────────────────────────────────────
  CREDITS_DEBITED: "credits_debited",
  CREDITS_GRANTED: "credits_granted",
  CREDITS_TOPPED_UP: "credits_topped_up",

  // ── Scout / discovery ────────────────────────────────────────────
  SCOUT_SEARCH_RUN: "scout_search_run",
  SCOUT_DEAL_IMPORTED: "scout_deal_imported",
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export interface EmitEventInput {
  actorId: string
  type: EventType
  entityType?: string
  entityId?: string
  targetUserId?: string
  metadata?: Record<string, unknown>
}

/**
 * Emit a single event. Fire-and-forget by default (never throws).
 *
 * Use `await` on this only when you need the event ID back (rare).
 * Most callers should `void emitEvent(...)` so the event log doesn't
 * gate the request lifecycle.
 */
export async function emitEvent(input: EmitEventInput): Promise<void> {
  try {
    await db.operatorEvent.create({
      data: {
        actorId: input.actorId,
        type: input.type,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        targetUserId: input.targetUserId ?? null,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    })
  } catch (err) {
    // Observability tool — failure here must NEVER take down the request.
    logger.warn("emitEvent failed (event dropped)", {
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Bulk emit — single DB round trip. Use for high-frequency batches
 * (e.g. importing 20 leads from Scout — one createMany beats 20
 * individual creates).
 */
export async function emitEvents(events: EmitEventInput[]): Promise<void> {
  if (events.length === 0) return
  try {
    await db.operatorEvent.createMany({
      data: events.map((e) => ({
        actorId: e.actorId,
        type: e.type,
        entityType: e.entityType ?? null,
        entityId: e.entityId ?? null,
        targetUserId: e.targetUserId ?? null,
        metadata: e.metadata
          ? (e.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      })),
    })
  } catch (err) {
    logger.warn("emitEvents bulk failed (events dropped)", {
      count: events.length,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Fetch recent events for a single actor, optionally filtered to types.
 * Used by the Today dashboard, activity timelines, daily digest.
 */
export async function getRecentEvents(args: {
  actorId: string
  types?: EventType[]
  since?: Date
  limit?: number
}) {
  return db.operatorEvent.findMany({
    where: {
      actorId: args.actorId,
      ...(args.types && args.types.length > 0 ? { type: { in: args.types } } : {}),
      ...(args.since ? { createdAt: { gte: args.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 50,
  })
}

/**
 * Fetch events targeting a specific entity (e.g. activity feed for a
 * single ClientDeal). No actor filter — admins see all events; per-user
 * scoping should happen at the call site.
 */
export async function getEventsForEntity(args: {
  entityType: string
  entityId: string
  limit?: number
}) {
  return db.operatorEvent.findMany({
    where: { entityType: args.entityType, entityId: args.entityId },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 50,
  })
}

/**
 * Aggregate event counts by type for a window. Powers Today dashboard
 * sparkline cards ("3 audits completed today", "12 deals enriched
 * this week").
 */
export async function countEventsByType(args: {
  actorId: string
  since: Date
  types?: EventType[]
}): Promise<Record<string, number>> {
  const rows = await db.operatorEvent.groupBy({
    by: ["type"],
    where: {
      actorId: args.actorId,
      createdAt: { gte: args.since },
      ...(args.types && args.types.length > 0 ? { type: { in: args.types } } : {}),
    },
    _count: { _all: true },
  })
  return Object.fromEntries(rows.map((r) => [r.type, r._count._all]))
}
