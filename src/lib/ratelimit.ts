import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Graceful degradation: if Upstash is not configured, skip rate limiting
function createRatelimiter(requests: number, windowSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
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

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
