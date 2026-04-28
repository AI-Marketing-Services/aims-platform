import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { put } from "@vercel/blob"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

async function resolveDbUser(clerkId: string) {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return { id: user.id }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "File must be an image (jpeg, png, webp, or gif)" },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File exceeds 5 MB limit" },
        { status: 400 },
      )
    }

    const blob = await put(
      `logos/${dbUser.id}/${file.name}`,
      file,
      {
        access: "public",
        contentType: file.type,
      },
    )

    await db.memberProfile.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, logoUrl: blob.url },
      update: { logoUrl: blob.url },
    })

    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err) {
    logger.error("Failed to upload logo", err, {
      endpoint: "POST /api/portal/onboarding/upload",
      userId,
    })
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 })
  }
}
