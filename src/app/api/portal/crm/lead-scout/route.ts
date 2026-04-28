import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { scoutLeads } from "@/lib/crm/lead-scout"
import { trackUsage } from "@/lib/usage"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
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

    return NextResponse.json({ leads, count: leads.length })
  } catch (err) {
    logger.error("Lead scout API failed", err, { userId: dbUserId })
    return NextResponse.json({ error: "Failed to search for leads" }, { status: 500 })
  }
}
