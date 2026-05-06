import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!["ADMIN", "SUPER_ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  // First check existence so we can distinguish 404 from internal failure
  // — without this, ANY delete error (FK violation, DB hiccup) was returning
  // 404 silently, which made debugging impossible.
  const existing = await db.utmLink.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    await db.utmLink.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Delete UTM link failed", err, {
      endpoint: "DELETE /api/admin/utm-links/[id]",
      id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
