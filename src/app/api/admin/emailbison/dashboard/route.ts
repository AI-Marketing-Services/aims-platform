import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getWorkspaceDashboard } from "@/lib/emailbison"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get all users with Email Bison connections
  const connections = await db.emailBisonConnection.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, company: true } },
    },
  })

  if (connections.length === 0) {
    return NextResponse.json({ clients: [] })
  }

  // Fetch dashboard data for each unique workspace (dedup so we don't hit same workspace twice)
  const workspaceIds = [...new Set(connections.map((c) => c.workspaceId))]
  const dashboardByWorkspace: Record<number, Awaited<ReturnType<typeof getWorkspaceDashboard>>> = {}

  await Promise.allSettled(
    workspaceIds.map(async (wsId) => {
      try {
        dashboardByWorkspace[wsId] = await getWorkspaceDashboard(wsId)
      } catch (err) {
        console.error(`Failed to fetch EB dashboard for workspace ${wsId}:`, err)
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

  return NextResponse.json({ clients })
}
