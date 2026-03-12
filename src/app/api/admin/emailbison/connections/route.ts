import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return false
  const role = (sessionClaims?.metadata as { role?: string })?.role
  return role && ["ADMIN", "SUPER_ADMIN"].includes(role)
}

// GET /api/admin/emailbison/connections — list all connections
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const connections = await db.emailBisonConnection.findMany({
    include: { user: { select: { id: true, name: true, email: true, company: true } } },
  })
  return NextResponse.json({ connections })
}

const upsertSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.coerce.number().int().positive(),
  workspaceName: z.string().min(1),
})

// POST /api/admin/emailbison/connections — upsert connection for a user
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
  const connection = await db.emailBisonConnection.upsert({
    where: { userId },
    create: { userId, workspaceId, workspaceName },
    update: { workspaceId, workspaceName },
  })
  return NextResponse.json({ connection })
}

// DELETE /api/admin/emailbison/connections?userId=xxx
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  await db.emailBisonConnection.delete({ where: { userId } })
  return NextResponse.json({ success: true })
}
