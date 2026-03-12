import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const noteSchema = z.object({
  content: z.string().min(1).max(5000),
  authorId: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  const body = await req.json()
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const note = await db.dealNote.create({
    data: {
      dealId,
      content: parsed.data.content,
      authorId: parsed.data.authorId ?? userId,
    },
  })

  // Log activity
  await db.dealActivity.create({
    data: {
      dealId,
      type: "NOTE_ADDED",
      detail: parsed.data.content.slice(0, 100),
      authorId: userId,
    },
  }).catch(() => null)

  return NextResponse.json(note, { status: 201 })
}
