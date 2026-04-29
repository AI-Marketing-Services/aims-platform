import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// POST — upload a logo image to Vercel Blob and persist the resulting public
// URL on AuditQuiz.logoUrl. Multipart/form-data with field name "file".
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await db.auditQuiz.findFirst({
      where: { id, ownerId: dbUserId, archivedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: "File must be a PNG, JPEG, WebP, or SVG image." },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 2 MB limit." },
        { status: 400 }
      )
    }

    const blob = await put(
      `audits/${id}/logo-${Date.now()}.${ext}`,
      file,
      {
        access: "public",
        contentType: file.type,
      }
    )

    await db.auditQuiz.update({
      where: { id },
      data: { logoUrl: blob.url },
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    logger.error("Failed to upload audit logo", err, {
      endpoint: "POST /api/portal/audits/[id]/logo",
      userId: dbUserId,
      quizId: id,
    })
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
