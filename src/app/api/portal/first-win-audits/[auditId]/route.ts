import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { isAuditVisibleToUser } from "@/lib/first-win-audit"
import { logger } from "@/lib/logger"

type RouteContext = {
  params: Promise<{ auditId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await ensureDbUserIdForApi()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { auditId } = await context.params

  try {
    const [user, audit] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      db.firstWinAudit.findUnique({
        where: { id: auditId },
        include: {
          clientDeal: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              contactEmail: true,
              website: true,
              industry: true,
              stage: true,
            },
          },
          respondents: {
            orderBy: { createdAt: "desc" },
          },
          responses: {
            orderBy: { createdAt: "asc" },
          },
          useCases: {
            orderBy: [{ firstWinScore: "desc" }, { createdAt: "asc" }],
          },
          reports: {
            orderBy: { version: "desc" },
          },
        },
      }),
    ])

    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 })

    const role = user?.role ?? "CLIENT"
    if (!isAuditVisibleToUser({ audit, userId, role })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ audit })
  } catch (err) {
    logger.error("First Win Audit detail failed", err, { userId, auditId })
    return NextResponse.json({ error: "Failed to load audit" }, { status: 500 })
  }
}
