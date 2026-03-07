import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getAdminMetrics, getApiCostSummary } from "@/lib/db/queries"

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section")

  if (section === "api-costs") {
    const days = parseInt(searchParams.get("days") ?? "30")
    const costs = await getApiCostSummary(days)
    return NextResponse.json(costs)
  }

  const metrics = await getAdminMetrics()
  return NextResponse.json(metrics)
}
