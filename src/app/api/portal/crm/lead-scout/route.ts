import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { scoutLeads, TavilyNotConfiguredError } from "@/lib/crm/lead-scout"
import { trackUsage } from "@/lib/usage"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { classifyAnthropicError } from "@/lib/ai"
import { markQuestEvent } from "@/lib/quests"
import { z } from "zod"

const scoutSchema = z.object({
  businessType: z.string().min(2).max(80),
  location: z.string().min(2).max(120),
  count: z.number().int().min(1).max(20).optional(),
})

export async function POST(req: Request) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = scoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", issues: parsed.error.issues }, { status: 400 })
    }

    const leads = await scoutLeads({
      businessType: parsed.data.businessType,
      location: parsed.data.location,
      count: parsed.data.count ?? 8,
      userId: dbUserId,
    })

    trackUsage(dbUserId, "lead_scout", { businessType: parsed.data.businessType, location: parsed.data.location }).catch(() => {})

    // Quest: Lead Scout Apprentice + Investigator + AI bot used
    void markQuestEvent(dbUserId, "lead_scout.run_completed", {
      metadata: { businessType: parsed.data.businessType, location: parsed.data.location, count: leads.length },
    })
    void markQuestEvent(dbUserId, "ai_bot.used", { metadata: { bot: "lead-scout" } })

    return NextResponse.json({ leads, count: leads.length })
  } catch (err) {
    // Tavily key missing — give the operator an actionable message
    // pointing them at Google Maps mode instead of the generic "No
    // leads found" toast that previously hid the config gap.
    if (err instanceof TavilyNotConfiguredError) {
      logger.warn("Lead scout: Tavily not configured", {
        endpoint: "POST /api/portal/crm/lead-scout",
        userId: dbUserId,
      })
      return NextResponse.json(
        {
          error:
            "Open-web search isn't available right now. Switch to the Google Maps tab to discover prospects.",
          reason: "tavily_not_configured",
        },
        { status: 503 },
      )
    }
    const classified = classifyAnthropicError(err)
    if (classified) {
      logger.warn("Lead scout: upstream busy", {
        endpoint: "POST /api/portal/crm/lead-scout",
        status: classified.status,
        userId: dbUserId,
      })
      return NextResponse.json({ error: classified.message }, { status: classified.status })
    }
    logger.error("Lead scout API failed", err, { userId: dbUserId })
    return NextResponse.json({ error: "Failed to search for leads" }, { status: 500 })
  }
}
