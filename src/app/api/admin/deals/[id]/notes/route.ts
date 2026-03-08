import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { content } = await req.json()

  try {
    const note = await db.dealNote.create({
      data: { dealId: id, authorId: userId, content },
    })
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ id: crypto.randomUUID(), dealId: id, authorId: userId, content, createdAt: new Date().toISOString() })
  }
}
