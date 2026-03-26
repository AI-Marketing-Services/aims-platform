import { NextResponse } from "next/server"
import { getServiceArms } from "@/lib/db/queries"
import type { ServicePillar, ServiceStatus } from "@prisma/client"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const services = await getServiceArms({
      pillar: (searchParams.get("pillar") as ServicePillar) ?? undefined,
      status: (searchParams.get("status") as ServiceStatus) ?? undefined,
      featured: searchParams.get("featured") === "true",
    })

    return NextResponse.json(services, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (err) {
    logger.error("Failed to fetch services:", err)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
