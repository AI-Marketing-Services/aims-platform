/**
 * Google Places API (New) v1 — discovery via the searchText endpoint.
 *
 * NOTE: this uses places.googleapis.com/v1, NOT the legacy
 * maps.googleapis.com/maps/api/place. The legacy endpoint charges ~5x
 * more and returns less per call. Always pass X-Goog-FieldMask, otherwise
 * Google bills you the highest tier (full-spec response).
 *
 * Used by the Scout discovery tool — operators search "HVAC companies in
 * Austin TX" and bulk-import results into their CRM as ClientDeal rows.
 */
import { z } from "zod"

export const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius_meters: z.number().min(100).max(50000),
  type: z.string().optional(),
  keyword: z.string().optional(),
  min_rating: z.number().min(0).max(5).optional(),
  min_reviews: z.number().int().min(0).optional(),
  page_token: z.string().optional(),
})

interface AddressComponent {
  longText: string
  shortText: string
  types: string[]
}

interface NewPlace {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  types?: string[]
  businessStatus?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  addressComponents?: AddressComponent[]
}

interface PlacesNewSearchResponse {
  places?: NewPlace[]
  nextPageToken?: string
}

export interface PlaceResult {
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  rating: number | null
  reviews_count: number | null
  phone: string | null
  website: string | null
  types: string[]
  photo_url: string | null
  business_status: string | null
  state: string | null
  zip: string | null
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.businessStatus",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "nextPageToken",
].join(",")

// In-memory cache (10 min TTL) — repeated identical searches don't burn
// API credits. First-page only; paginated tokens always re-fetch.
const placesCache = new Map<string, { data: PlacesNewSearchResponse; ts: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000

function cacheKey(p: z.infer<typeof searchSchema>): string {
  return `${p.lat.toFixed(3)},${p.lng.toFixed(3)},${p.radius_meters},${p.type ?? ""},${p.keyword ?? ""}`
}

function extractComponent(c: AddressComponent[] | undefined, type: string): string | null {
  return c?.find((x) => x.types.includes(type))?.shortText ?? null
}

function mapPlaceToResult(place: NewPlace): PlaceResult {
  const c = place.addressComponents
  return {
    place_id: place.id,
    name: place.displayName?.text ?? "",
    address: place.shortFormattedAddress ?? place.formattedAddress ?? "",
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    rating: place.rating ?? null,
    reviews_count: place.userRatingCount ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    types: place.types ?? [],
    photo_url: null,
    business_status: place.businessStatus ?? null,
    state: extractComponent(c, "administrative_area_level_1"),
    zip: extractComponent(c, "postal_code"),
  }
}

function applyFilters(p: z.infer<typeof searchSchema>) {
  return (place: PlaceResult) => {
    if (p.min_rating !== undefined && (place.rating === null || place.rating < p.min_rating)) {
      return false
    }
    if (
      p.min_reviews !== undefined &&
      (place.reviews_count === null || place.reviews_count < p.min_reviews)
    ) {
      return false
    }
    return true
  }
}

export async function searchPlaces(input: z.infer<typeof searchSchema>): Promise<{
  results: PlaceResult[]
  nextPageToken: string | null
  cached: boolean
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured")

  const key = !input.page_token ? cacheKey(input) : null
  if (key) {
    const hit = placesCache.get(key)
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      return {
        results: (hit.data.places ?? []).map(mapPlaceToResult).filter(applyFilters(input)),
        nextPageToken: hit.data.nextPageToken ?? null,
        cached: true,
      }
    }
  }

  const textQuery = input.keyword || input.type || "business"
  const body: Record<string, unknown> = {
    textQuery,
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: { latitude: input.lat, longitude: input.lng },
        radius: input.radius_meters,
      },
    },
  }
  if (input.page_token) body.pageToken = input.page_token

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Google Places API failed: ${errText}`)
  }
  const data = (await res.json()) as PlacesNewSearchResponse
  if (key) placesCache.set(key, { data, ts: Date.now() })

  return {
    results: (data.places ?? []).map(mapPlaceToResult).filter(applyFilters(input)),
    nextPageToken: data.nextPageToken ?? null,
    cached: false,
  }
}

/**
 * Parse a Google Places shortFormattedAddress like "123 Main St, Austin, TX
 * 78701" into structured pieces. Falls back to the raw line when the shape
 * is unexpected so we never lose data.
 */
export function parseAddress(raw: string): {
  address_line_1: string
  city: string | null
  state: string | null
  zip: string | null
} {
  const parts = raw.split(",").map((p) => p.trim())
  const address_line_1 = parts[0] || raw
  if (parts.length === 1) {
    return { address_line_1, city: null, state: null, zip: null }
  }
  const city = parts.length >= 2 ? parts[1] : null
  const lastPart = parts[parts.length - 1] ?? ""
  const m = lastPart.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  if (m) return { address_line_1, city, state: m[1].toUpperCase(), zip: m[2] }
  return { address_line_1, city, state: null, zip: null }
}
