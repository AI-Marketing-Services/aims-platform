import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Graceful degradation: if Redis is not configured, skip rate limiting.
// Accepts both UPSTASH_REDIS_REST_* (direct Upstash) and KV_REST_API_*
// (Vercel KV, which is Upstash-compatible) so a Vercel KV-only project
// still gets rate limiting without re-aliasing env vars.
function createRatelimiter(requests: number, windowSeconds: number) {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    return null
  }
  const redis = new Redis({ url, token })
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
