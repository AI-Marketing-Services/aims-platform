import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { clientId } = await params

  try {
    const user = await db.user.findUnique({
      where: { id: clientId },
      include: {
        subscriptions: {
          include: {
            serviceArm: { select: { id: true, name: true, slug: true, pillar: true } },
            fulfillmentTasks: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
        deals: {
          include: {
            activities: { orderBy: { createdAt: "desc" }, take: 5 },
            serviceArms: { include: { serviceArm: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
        supportTickets: {
          include: {
            responses: { orderBy: { createdAt: "desc" }, take: 3 },
          },
          orderBy: { createdAt: "desc" },
        },
        leadMagnetSubmissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error(`Failed to fetch client ${clientId}:`, err)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}
