import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { markQuestEvent } from "@/lib/quests"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

const createRuleSchema = z.object({
  stageTrigger: z.enum([
    "PROSPECT",
    "DISCOVERY_CALL",
    "PROPOSAL_SENT",
    "ACTIVE_RETAINER",
    "COMPLETED",
    "LOST",
  ]),
  daysStale: z.number().int().min(1).max(90),
  message: z.string().max(1000).nullish(),
  isActive: z.boolean().optional().default(true),
  clientDealId: z.string().cuid().nullish(),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const rules = await db.followUpRule.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ rules })
  } catch (err) {
    logger.error("Failed to fetch follow-up rules", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const rule = await db.followUpRule.create({
      data: {
        userId: dbUserId,
        stageTrigger: parsed.data.stageTrigger,
        daysStale: parsed.data.daysStale,
        message: parsed.data.message ?? null,
        isActive: parsed.data.isActive ?? true,
        clientDealId: parsed.data.clientDealId ?? null,
      },
    })

    // Quest: First Follow-Up Rule
    void markQuestEvent(dbUserId, "follow_up.first_rule_created", {
      metadata: { ruleId: rule.id, stageTrigger: rule.stageTrigger },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create follow-up rule", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
