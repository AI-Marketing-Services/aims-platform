import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getWorkspaceDashboard } from "@/lib/emailbison"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
})

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    take: searchParams.get("take") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
  }

  const { take, skip } = parsed.data

  // Get all users with Email Bison connections
  const [connections, total] = await Promise.all([
    db.emailBisonConnection.findMany({
      take,
      skip,
      include: {
        user: { select: { id: true, name: true, email: true, company: true } },
      },
    }),
    db.emailBisonConnection.count(),
  ])

  if (connections.length === 0) {
    return NextResponse.json({ data: [], meta: { total, take, skip } })
  }

  // Fetch dashboard data for each unique workspace (dedup so we don't hit same workspace twice)
  const workspaceIds = [...new Set(connections.map((c) => c.workspaceId))]
  const dashboardByWorkspace: Record<number, Awaited<ReturnType<typeof getWorkspaceDashboard>>> = {}

  await Promise.allSettled(
    workspaceIds.map(async (wsId) => {
      try {
        dashboardByWorkspace[wsId] = await getWorkspaceDashboard(wsId)
      } catch (err) {
        logger.error(`Failed to fetch EB dashboard for workspace ${wsId}:`, err)
      }
    })
  )

  // Build per-client response
  const clients = connections.map((conn) => {
    const dashboard = dashboardByWorkspace[conn.workspaceId]
    return {
      userId: conn.user.id,
      name: conn.user.name,
      email: conn.user.email,
      company: conn.user.company,
      workspaceId: conn.workspaceId,
      workspaceName: conn.workspaceName,
      totals: dashboard?.totals ?? null,
      replyRate: dashboard?.replyRate ?? null,
      bounceRate: dashboard?.bounceRate ?? null,
      campaigns: dashboard?.campaigns ?? [],
    }
  })

  return NextResponse.json({ data: clients, meta: { total, take, skip } })
}
