import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
    }

    const { take, skip, search } = parsed.data

    const where = search
      ? {
          OR: [
            { subject: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
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
      }),
      db.supportTicket.count({ where }),
    ])

    return NextResponse.json({ data: tickets, meta: { total, take, skip } })
  } catch (err) {
    logger.error("Failed to fetch admin tickets", err, { endpoint: "GET /api/admin/tickets" })
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
