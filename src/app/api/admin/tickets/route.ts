import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const tickets = await db.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            message: true,
            isAdmin: true,
            authorId: true,
            authorName: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(tickets)
  } catch (err) {
    logger.error("Failed to fetch admin tickets", err, { endpoint: "GET /api/admin/tickets" })
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
