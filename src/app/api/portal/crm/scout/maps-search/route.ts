import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { searchPlaces } from "@/lib/enrichment/google-places/search"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { debitCredits, hasBalance, InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"
import { CREDIT_COSTS } from "@/lib/enrichment/credits/pricing"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"

export const dynamic = "force-dynamic"
export const maxDuration = 30

/**
 * POST /api/portal/crm/scout/maps-search
 *
 * Discovery via Google Places API (New) v1. Operator types
 * "HVAC companies in Austin TX, min rating 4.0" → we hit Places →
 * return up to 20 results with name/address/rating/website/phone +
 * a flag indicating which place IDs already exist in the operator's
 * CRM (so the UI can show "already imported" badges).
 *
 * Charges 1 credit per search (PLACES_SEARCH cost). Geocoding the
 * location string happens in the lib via Google's locationBias circle
 * — operator just types a city, we don't ask them for coordinates.
 *
 * The location-string→coords step uses Google's Geocoding API
 * (separate from Places). For MVP we accept lat/lng directly OR a
 * pre-geocoded textQuery that includes the location, e.g. "HVAC
 * companies in Austin TX" — Google Places searchText handles location
 * inference inside the textQuery itself, so we don't strictly need a
 * separate geocode step.
 */

const searchSchema = z.object({
  // Either a free-text query that includes location, OR explicit coords.
  query: z.string().min(2).max(200),
  // Optional explicit center for radius search; if omitted Places infers
  // from the query text.
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius_meters: z.number().min(1000).max(50000).default(50000),
  min_rating: z.number().min(0).max(5).optional(),
  min_reviews: z.number().int().min(0).optional(),
  page_token: z.string().optional(),
})

// Default centre when caller doesn't specify coords — continental US
// centroid. Places API still uses the textQuery for actual filtering;
// this just provides a locationBias hint when explicit coords are absent.
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }

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
  const parsed = searchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Pre-flight credit check
  const balance = await hasBalance(dbUserId, CREDIT_COSTS.PLACES_SEARCH)
  if (!balance.ok) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: CREDIT_COSTS.PLACES_SEARCH,
        available: balance.current,
      },
      { status: 402 },
    )
  }

  try {
    const center =
      parsed.data.lat !== undefined && parsed.data.lng !== undefined
        ? { lat: parsed.data.lat, lng: parsed.data.lng }
        : DEFAULT_CENTER

    const result = await searchPlaces({
      lat: center.lat,
      lng: center.lng,
      radius_meters: parsed.data.radius_meters,
      keyword: parsed.data.query,
      min_rating: parsed.data.min_rating,
      min_reviews: parsed.data.min_reviews,
      page_token: parsed.data.page_token,
    })

    // Charge credit only for fresh (non-cached) calls — same cache
    // behaviour as the lib so repeated searches don't double-bill.
    if (!result.cached) {
      await debitCredits({
        userId: dbUserId,
        amount: CREDIT_COSTS.PLACES_SEARCH,
        reason: "places-search",
        metadata: { query: parsed.data.query, count: result.results.length },
      })
      void emitEvent({
        actorId: dbUserId,
        type: EVENT_TYPES.SCOUT_SEARCH_RUN,
        metadata: {
          query: parsed.data.query,
          count: result.results.length,
          cached: false,
        },
      })
    }

    // Annotate which places are already in this operator's CRM
    const placeIds = result.results.map((r) => r.place_id).filter(Boolean)
    const existing =
      placeIds.length > 0
        ? await db.clientDeal.findMany({
            where: {
              userId: dbUserId,
              googlePlaceId: { in: placeIds },
            },
            select: { googlePlaceId: true, id: true },
          })
        : []
    const existingMap = new Map(existing.map((d) => [d.googlePlaceId, d.id]))

    const annotated = result.results.map((r) => ({
      ...r,
      alreadyImported: existingMap.has(r.place_id),
      existingDealId: existingMap.get(r.place_id) ?? null,
    }))

    return NextResponse.json({
      ok: true,
      results: annotated,
      nextPageToken: result.nextPageToken,
      cached: result.cached,
      creditCost: result.cached ? 0 : CREDIT_COSTS.PLACES_SEARCH,
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "Insufficient credits", required: err.required, available: err.available },
        { status: 402 },
      )
    }
    logger.error("Maps search failed", err, {
      endpoint: "POST /api/portal/crm/scout/maps-search",
      userId: dbUserId,
      query: parsed.data.query,
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 },
    )
  }
}
