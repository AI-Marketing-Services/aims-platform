import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { put } from "@vercel/blob"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Favicons. Browsers send "image/x-icon" for .ico, some systems send
  // "image/vnd.microsoft.icon" — accept both. Without these, favicon
  // upload silently 400s in the editor with "must be an image" error.
  "image/x-icon",
  "image/vnd.microsoft.icon",
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
        {
          ok: false,
          error: `File type "${file.type}" not supported. Use PNG, JPEG, WebP, GIF, SVG, or ICO.`,
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File exceeds 5 MB limit" },
        { status: 400 },
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.error(
        "Blob upload attempted without BLOB_READ_WRITE_TOKEN configured",
        null,
        { endpoint: "POST /api/portal/onboarding/upload", userId }
      )
      return NextResponse.json(
        {
          ok: false,
          error:
            "Logo uploads aren't enabled yet. Paste a hosted image URL below as a workaround.",
        },
        { status: 503 }
      )
    }

    // Derive the extension from the validated MIME type — never trust
    // file.name (attacker-controlled, can contain path-traversal segments
    // like "../../" or null bytes). Use a server-generated UUID for the
    // basename so uploads can't collide or overwrite each other either.
    const ext =
      file.type === "image/png" ? "png" :
      file.type === "image/jpeg" ? "jpg" :
      file.type === "image/webp" ? "webp" :
      file.type === "image/gif" ? "gif" :
      file.type === "image/svg+xml" ? "svg" :
      file.type === "image/x-icon" ? "ico" :
      file.type === "image/vnd.microsoft.icon" ? "ico" : "bin"
    const safeName = `${randomUUID()}.${ext}`

    try {
      const blob = await put(
        `logos/${dbUser.id}/${safeName}`,
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
    } catch (blobErr) {
      // Surface the actual Vercel Blob failure category to the operator
      // instead of the generic "Upload failed" — distinguishes between
      // "token is wrong" (most common after a rotation) and "the blob
      // store no longer exists" so they can self-serve the fix.
      const errMessage =
        blobErr instanceof Error ? blobErr.message : String(blobErr)
      logger.error("Vercel Blob put() failed", blobErr, {
        endpoint: "POST /api/portal/onboarding/upload",
        userId,
        fileType: file.type,
        fileSize: file.size,
      })
      const isAuthError =
        /token|unauthor|forbidden|invalid/i.test(errMessage)
      const friendlyMsg = isAuthError
        ? "Upload failed: the Vercel Blob token is invalid or expired. Rotate it in the Vercel project settings and redeploy."
        : `Upload failed: ${errMessage.slice(0, 200)}`
      return NextResponse.json(
        { ok: false, error: friendlyMsg },
        { status: 500 },
      )
    }
  } catch (err) {
    logger.error("Failed to upload logo", err, {
      endpoint: "POST /api/portal/onboarding/upload",
      userId,
    })
    return NextResponse.json(
      {
        ok: false,
        error: "Upload failed. Paste a hosted image URL below as a workaround.",
      },
      { status: 500 }
    )
  }
}
