import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Graceful degradation in DEV ONLY: if Redis is not configured, skip rate
// limiting. In PRODUCTION we fail-closed at module load — an unprotected
// rate limiter on AI endpoints means a single attacker can burn through
// the entire Anthropic / OpenAI budget in minutes. Better to crash the
// build than ship silently-uncapped endpoints.
//
// Accepts both UPSTASH_REDIS_REST_* (direct Upstash) and KV_REST_API_*
// (Vercel KV, which is Upstash-compatible) so a Vercel KV-only project
// still gets rate limiting without re-aliasing env vars.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

// Hard fail at runtime in production if unset, but allow `next build`
// (NEXT_PHASE === "phase-production-build") to collect page data even
// when the vars haven't been wired into the local env yet — Vercel
// injects them at runtime, not at build time.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  (!REDIS_URL || !REDIS_TOKEN)
) {
  throw new Error(
    "Rate limiter is not configured. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN) in production. Refusing to start without rate limiting.",
  )
}

function createRatelimiter(requests: number, windowSeconds: number) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null
  }
  const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
  })
}

// 5 submissions per minute per IP for public intake/lead-magnet forms
export const formRatelimit = createRatelimiter(5, 60)

// 3 AI audit requests per minute per IP (more expensive)
export const auditRatelimit = createRatelimiter(3, 60)

// 20 chat messages per minute per IP/user (public chatbot + portal chat)
export const chatRatelimit = createRatelimiter(20, 60)

// 10 checkout attempts per minute per IP (prevents abuse)
export const checkoutRatelimit = createRatelimiter(10, 60)

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

/**
 * Standard 429 response for rate-limited routes. Emits a structured warn so
 * we can see during testing whether real users are getting throttled, rather
 * than the limit-hits being completely silent. Use this everywhere a route
 * returns 429 for a rate-limit miss.
 */
export function rateLimitedResponse(
  req: Request,
  endpoint: string,
  identifier?: string,
): NextResponse {
  const ip = getIp(req)
  logger.warn("Rate limit hit", {
    endpoint,
    ip,
    ...(identifier ? { identifier } : {}),
  })
  return NextResponse.json({ error: "Too many requests" }, { status: 429 })
}
