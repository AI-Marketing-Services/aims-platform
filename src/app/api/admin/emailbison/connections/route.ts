import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return false
  const role = (sessionClaims?.metadata as { role?: string })?.role
  return role && ["ADMIN", "SUPER_ADMIN"].includes(role)
}

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
})

// GET /api/admin/emailbison/connections - list all connections
export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
    }

    const { take, skip } = parsed.data

    const [connections, total] = await Promise.all([
      db.emailBisonConnection.findMany({
        take,
        skip,
        include: { user: { select: { id: true, name: true, email: true, company: true } } },
      }),
      db.emailBisonConnection.count(),
    ])

    return NextResponse.json({ data: connections, meta: { total, take, skip } })
  } catch (err) {
    logger.error("Failed to fetch Email Bison connections:", err)
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 })
  }
}

const upsertSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.coerce.number().int().positive(),
  workspaceName: z.string().min(1),
})

// POST /api/admin/emailbison/connections - upsert connection for a user
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "userId, workspaceId (number), workspaceName required" }, { status: 400 })
  }

  const { userId, workspaceId, workspaceName } = parsed.data
  try {
    const connection = await db.emailBisonConnection.upsert({
      where: { userId },
      create: { userId, workspaceId, workspaceName },
      update: { workspaceId, workspaceName },
    })
    return NextResponse.json({ connection })
  } catch (err) {
    logger.error("Failed to upsert Email Bison connection:", err)
    return NextResponse.json({ error: "Failed to save connection" }, { status: 500 })
  }
}

// DELETE /api/admin/emailbison/connections?userId=xxx
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    await db.emailBisonConnection.delete({ where: { userId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete Email Bison connection:", err)
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 })
  }
}
