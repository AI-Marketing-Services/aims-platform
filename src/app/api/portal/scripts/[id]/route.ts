import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { AiScriptType } from "@prisma/client"

const patchScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.nativeEnum(AiScriptType).optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const script = await db.aiScript.findFirst({
      where: { id, userId: dbUserId },
      include: {
        clientDeal: { select: { companyName: true, contactName: true } },
      },
    })
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ script })
  } catch (err) {
    logger.error("Failed to fetch AI script", err, { userId, scriptId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = patchScriptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const existing = await db.aiScript.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const script = await db.aiScript.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ script })
  } catch (err) {
    logger.error("Failed to update AI script", err, { userId, scriptId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  try {
    const existing = await db.aiScript.findFirst({
      where: { id, userId: dbUserId },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.aiScript.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete AI script", err, { userId, scriptId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
