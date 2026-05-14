import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { buildFirstWinAuditCreateData } from "@/lib/first-win-audit"
import { logger } from "@/lib/logger"

const createAuditSchema = z.object({
  clientDealId: z.string().min(1),
  companyName: z.string().min(1).max(200),
  industry: z.string().max(120).optional().nullable(),
  aggregateUseAllowed: z.boolean().optional(),
})

export async function GET() {
  const userId = await ensureDbUserIdForApi()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const audits = await db.firstWinAudit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        clientDeal: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            contactEmail: true,
            stage: true,
          },
        },
        _count: {
          select: {
            respondents: true,
            responses: true,
            useCases: true,
            reports: true,
          },
        },
      },
    })

    return NextResponse.json({ audits })
  } catch (err) {
    logger.error("First Win Audit list failed", err, { userId })
    return NextResponse.json({ error: "Failed to load audits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await ensureDbUserIdForApi()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: z.infer<typeof createAuditSchema>
  try {
    body = createAuditSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid audit request" }, { status: 400 })
  }

  try {
    const clientDeal = await db.clientDeal.findFirst({
      where: {
        id: body.clientDealId,
        userId,
      },
      select: {
        id: true,
        companyName: true,
        industry: true,
      },
    })

    if (!clientDeal) {
      return NextResponse.json({ error: "Client deal not found" }, { status: 404 })
    }

    const audit = await db.firstWinAudit.create({
      data: buildFirstWinAuditCreateData({
        userId,
        clientDealId: clientDeal.id,
        companyName: body.companyName || clientDeal.companyName,
        industry: body.industry ?? clientDeal.industry,
        aggregateUseAllowed: body.aggregateUseAllowed,
      }),
    })

    return NextResponse.json({ audit }, { status: 201 })
  } catch (err) {
    logger.error("First Win Audit create failed", err, { userId, clientDealId: body.clientDealId })
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 })
  }
}
