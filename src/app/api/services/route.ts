import { NextResponse } from "next/server"
import { getServiceArms } from "@/lib/db/queries"
import type { ServicePillar, ServiceStatus } from "@prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const services = await getServiceArms({
    pillar: (searchParams.get("pillar") as ServicePillar) ?? undefined,
    status: (searchParams.get("status") as ServiceStatus) ?? undefined,
    featured: searchParams.get("featured") === "true",
  })

  return NextResponse.json(services)
}
