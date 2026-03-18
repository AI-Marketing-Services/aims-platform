// src/lib/env.ts — Typed environment variable helpers
// Groups: required (throws), optional (warns once, returns undefined)

const warnedVars = new Set<string>()

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

function optional(name: string): string | undefined {
  const val = process.env[name]
  if (!val && typeof window === "undefined" && !warnedVars.has(name)) {
    warnedVars.add(name)
    console.warn(`[env] Missing optional var: ${name} — related features will be disabled`)
  }
  return val
}

// ── Required (throw if missing) ──────────────────────────────────────────────
export const DATABASE_URL = required("DATABASE_URL")
export const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = required("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
export const CLERK_SECRET_KEY = required("CLERK_SECRET_KEY")

// ── Optional (warn once if missing) ──────────────────────────────────────────

// App URL
export const NEXT_PUBLIC_APP_URL = optional("NEXT_PUBLIC_APP_URL")

// Stripe
export const STRIPE_SECRET_KEY = optional("STRIPE_SECRET_KEY")
export const STRIPE_WEBHOOK_SECRET = optional("STRIPE_WEBHOOK_SECRET")

// AI providers
export const ANTHROPIC_API_KEY = optional("ANTHROPIC_API_KEY")
export const GEMINI_API_KEY = optional("GEMINI_API_KEY")

// Email
export const RESEND_API_KEY = optional("RESEND_API_KEY")

// Asana
export const ASANA_PAT = optional("ASANA_PAT")
export const ASANA_WORKSPACE_GID = optional("ASANA_WORKSPACE_GID")

// Firecrawl
export const FIRECRAWL_API_KEY = optional("FIRECRAWL_API_KEY")

// Redis / rate limiting
export const UPSTASH_REDIS_REST_URL = optional("UPSTASH_REDIS_REST_URL")
export const UPSTASH_REDIS_REST_TOKEN = optional("UPSTASH_REDIS_REST_TOKEN")

// Search
export const TAVILY_API_KEY = optional("TAVILY_API_KEY")

// Close CRM
export const CLOSE_API_KEY = optional("CLOSE_API_KEY")

// Email Bison
export const EMAIL_BISON_API_KEY = optional("EMAIL_BISON_API_KEY")

// Slack
export const SLACK_WEBHOOK_URL = optional("SLACK_WEBHOOK_URL")

// Secrets
export const CRON_SECRET = optional("CRON_SECRET")
export const BOOTSTRAP_SECRET = optional("BOOTSTRAP_SECRET")

// Webhook secrets
export const CLERK_WEBHOOK_SECRET = optional("CLERK_WEBHOOK_SECRET")
export const CLOSE_WEBHOOK_SECRET = optional("CLOSE_WEBHOOK_SECRET")
