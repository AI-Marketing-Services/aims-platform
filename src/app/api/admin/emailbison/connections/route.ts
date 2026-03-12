import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

// GET /api/admin/emailbison/connections — list all connections
export async function GET() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const connections = await db.emailBisonConnection.findMany({
    include: { user: { select: { id: true, name: true, email: true, company: true } } },
  })
  return NextResponse.json({ connections })
}

// POST /api/admin/emailbison/connections — upsert connection for a user
export async function POST(req: Request) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId, workspaceId, workspaceName } = await req.json()
  if (!userId || !workspaceId || !workspaceName) {
    return NextResponse.json({ error: "userId, workspaceId, workspaceName required" }, { status: 400 })
  }

  const connection = await db.emailBisonConnection.upsert({
    where: { userId },
    create: { userId, workspaceId: Number(workspaceId), workspaceName },
    update: { workspaceId: Number(workspaceId), workspaceName },
  })
  return NextResponse.json({ connection })
}

// DELETE /api/admin/emailbison/connections?userId=xxx
export async function DELETE(req: Request) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  await db.emailBisonConnection.delete({ where: { userId } })
  return NextResponse.json({ success: true })
}
