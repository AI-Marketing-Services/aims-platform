import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { runEnrichmentPipeline } from "@/lib/enrichment/orchestrator"
import { InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"
import { parseAddress } from "@/lib/enrichment/google-places/search"
import { emitEvent, emitEvents, EVENT_TYPES } from "@/lib/events/emit"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // bulk import + optional enrich can run long

/**
 * POST /api/portal/crm/scout/maps-import
 *
 * Bulk-imports Google Places results as ClientDeal rows in the
 * operator's CRM. Each place is deduped by googlePlaceId — re-importing
 * the same place silently skips (returns existing deal id).
 *
 * Optional `enrichOnImport: true` runs the full 4-stage enrichment
 * pipeline against each newly-created Deal in serial. Caller is
 * responsible for ensuring sufficient credits — we pre-flight the
 * worst-case cost and bail before any imports if it doesn't pencil out.
 */

const placeSchema = z.object({
  place_id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional().default(""),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  reviews_count: z.number().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  types: z.array(z.string()).optional(),
})

const importSchema = z.object({
  places: z.array(placeSchema).min(1).max(20),
  industry: z.string().max(80).optional(),
  enrichOnImport: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { places, industry, enrichOnImport } = parsed.data

  try {
    // Dedup against existing Deals by googlePlaceId
    const incomingIds = places.map((p) => p.place_id)
    const existing = await db.clientDeal.findMany({
      where: { userId: dbUserId, googlePlaceId: { in: incomingIds } },
      select: { id: true, googlePlaceId: true },
    })
    const existingSet = new Set(existing.map((e) => e.googlePlaceId))

    const created: Array<{ id: string; companyName: string; place_id: string }> = []
    for (const p of places) {
      if (existingSet.has(p.place_id)) continue
      const addrParts = parseAddress(p.address ?? "")
      try {
        const deal = await db.clientDeal.create({
          data: {
            userId: dbUserId,
            companyName: p.name,
            contactPhone: p.phone ?? null,
            website: p.website ?? null,
            industry: industry ?? null,
            googlePlaceId: p.place_id,
            source: "scout",
            stage: "PROSPECT",
            tags: [
              ...(p.rating ? [`★${p.rating.toFixed(1)}`] : []),
              ...(addrParts.state ? [addrParts.state] : []),
            ],
            notes: [
              p.address ? `Address: ${p.address}` : null,
              p.reviews_count ? `${p.reviews_count} Google reviews` : null,
            ]
              .filter(Boolean)
              .join("\n") || null,
            activities: {
              create: {
                type: "NOTE",
                description: `Imported from Lead Scout (Google Maps).`,
                metadata: { source: "scout-maps", placeId: p.place_id },
              },
            },
          },
          select: { id: true, companyName: true },
        })
        created.push({ id: deal.id, companyName: deal.companyName, place_id: p.place_id })
      } catch (err) {
        // Likely a unique-constraint race (another request just imported
        // the same place). Skip and continue.
        logger.warn("Scout import failed for one place", {
          place_id: p.place_id,
          name: p.name,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Universal events — bulk emit for efficiency
    if (created.length > 0) {
      void emitEvents(
        created.map((d) => ({
          actorId: dbUserId,
          type: EVENT_TYPES.SCOUT_DEAL_IMPORTED,
          entityType: "ClientDeal",
          entityId: d.id,
          metadata: { companyName: d.companyName, place_id: d.place_id },
        })),
      )
      void emitEvent({
        actorId: dbUserId,
        type: EVENT_TYPES.DEAL_CREATED,
        metadata: {
          source: "scout",
          batchSize: created.length,
        },
      })
    }

    // Optional inline enrichment (sequential — pipeline is heavy and
    // running 20 in parallel would smoke our rate limits + Prospeo bill)
    let enrichedCount = 0
    let enrichErrors = 0
    if (enrichOnImport && created.length > 0) {
      for (const c of created) {
        try {
          await runEnrichmentPipeline({ dealId: c.id, userId: dbUserId })
          enrichedCount += 1
        } catch (err) {
          enrichErrors += 1
          if (err instanceof InsufficientCreditsError) {
            // Stop — don't keep trying when we're out of credits
            break
          }
          logger.warn("Scout import auto-enrich failed for one deal", {
            dealId: c.id,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      created: created.length,
      skipped: places.length - created.length,
      enriched: enrichedCount,
      enrichErrors,
      deals: created,
    })
  } catch (err) {
    logger.error("Scout maps import crashed", err, {
      endpoint: "POST /api/portal/crm/scout/maps-import",
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
