import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const recording = await db.callRecording.findFirst({
    where: { id, userId },
  })
  if (!recording)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ recording })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const recording = await db.callRecording.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!recording)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.callRecording.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
