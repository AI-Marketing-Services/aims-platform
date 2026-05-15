import { NextResponse } from "next/server"
import { z } from "zod"
import { put } from "@vercel/blob"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { ClientDealNoteKind } from "@prisma/client"

export const dynamic = "force-dynamic"
// Larger payload limit for pasted transcripts (Zoom transcripts can be
// 50K+ chars). Default Next.js body size is 1MB, plenty for text.
// File uploads use multipart/form-data which has its own ~4MB limit on
// Vercel — we cap files at 10MB anyway.

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
// Explicit allowlist. `application/octet-stream` was previously
// included as a "generic" fallback — but any attacker can claim
// octet-stream and upload an .exe / .jar / .html with embedded JS
// that, served from our Blob bucket with public access, becomes a
// drive-by-download host under our brand. Strict allowlist only.
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  // audio
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  // video (small clips only — operators usually upload audio for transcripts)
  "video/mp4",
  "video/webm",
])

const textNoteSchema = z.object({
  kind: z.enum(["NOTE", "TRANSCRIPT"]).optional().default("NOTE"),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(120_000), // 120K chars handles long transcripts
  meetingDate: z.string().datetime().optional(),
})

/**
 * POST /api/portal/crm/deals/[id]/notes
 *
 * Two paths based on Content-Type:
 *   application/json     → save a pasted/typed text note
 *   multipart/form-data  → upload a file (PDF / audio / etc.) to Blob
 *
 * On JSON: { kind, title?, content, meetingDate? }
 * On multipart: file (required), title?, kind? (auto-derived from
 *   mime if absent), meetingDate?
 *
 * Returns the created ClientDealNote row.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  // Verify ownership
  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  const contentType = req.headers.get("content-type") ?? ""

  // ── File upload path ───────────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "File uploads aren't enabled yet. Connect Vercel Blob in your project settings, or paste the contents as a text note instead.",
        },
        { status: 503 },
      )
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    const file = formData.get("file")
    const title = (formData.get("title") as string | null)?.trim() || null
    const meetingDateRaw = formData.get("meetingDate") as string | null
    const explicitKind = formData.get("kind") as string | null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds the ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)}MB limit.`,
        },
        { status: 413 },
      )
    }
    if (!ALLOWED_FILE_TYPES.has(file.type) && file.type !== "") {
      return NextResponse.json(
        {
          error: `Unsupported file type (${file.type}). Allowed: PDF, audio (mp3/wav/m4a), markdown, plain text.`,
        },
        { status: 415 },
      )
    }

    // Derive kind from mime type if not provided
    const kind: ClientDealNoteKind = (() => {
      if (explicitKind === "RECORDING" || explicitKind === "PDF" || explicitKind === "FILE") {
        return explicitKind as ClientDealNoteKind
      }
      if (file.type === "application/pdf") return ClientDealNoteKind.PDF
      if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
        return ClientDealNoteKind.RECORDING
      }
      return ClientDealNoteKind.FILE
    })()

    try {
      // Vercel Blob upload — public access so the operator can re-download
      // their own file via the URL. Operators can only see their own deals
      // via the API ownership check, so the URL alone isn't enough to
      // exfiltrate cross-operator data even if it leaks.
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
      const blob = await put(
        `client-deals/${dealId}/notes/${Date.now()}-${safeName}`,
        file,
        {
          access: "public",
          contentType: file.type || "application/octet-stream",
        },
      )

      const note = await db.clientDealNote.create({
        data: {
          clientDealId: dealId,
          kind,
          title: title ?? file.name,
          fileUrl: blob.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || null,
          meetingDate: meetingDateRaw ? new Date(meetingDateRaw) : null,
        },
      })

      // Activity log entry
      await db.clientDealActivity
        .create({
          data: {
            clientDealId: dealId,
            type: "NOTE",
            description: `Uploaded ${kind === "PDF" ? "PDF" : kind === "RECORDING" ? "recording" : "file"}: ${title ?? file.name}`,
            metadata: { noteId: note.id, fileName: file.name, fileSize: file.size },
          },
        })
        .catch(() => {})

      return NextResponse.json({ ok: true, note }, { status: 201 })
    } catch (err) {
      logger.error("Note file upload failed", err, { dealId, userId: dbUserId })
      return NextResponse.json(
        { error: "Upload failed. Try again or paste content as text." },
        { status: 500 },
      )
    }
  }

  // ── Text note path ────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = textNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid note", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const note = await db.clientDealNote.create({
      data: {
        clientDealId: dealId,
        kind: parsed.data.kind === "TRANSCRIPT" ? ClientDealNoteKind.TRANSCRIPT : ClientDealNoteKind.NOTE,
        title: parsed.data.title ?? null,
        content: parsed.data.content,
        meetingDate: parsed.data.meetingDate ? new Date(parsed.data.meetingDate) : null,
      },
    })

    await db.clientDealActivity
      .create({
        data: {
          clientDealId: dealId,
          type: "NOTE",
          description:
            parsed.data.kind === "TRANSCRIPT"
              ? `Transcript added${parsed.data.title ? `: ${parsed.data.title}` : ""}`
              : `Note added${parsed.data.title ? `: ${parsed.data.title}` : ""}`,
          metadata: { noteId: note.id, length: parsed.data.content.length },
        },
      })
      .catch(() => {})

    return NextResponse.json({ ok: true, note }, { status: 201 })
  } catch (err) {
    logger.error("Note text save failed", err, { dealId, userId: dbUserId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

/**
 * GET /api/portal/crm/deals/[id]/notes — list all notes for a deal,
 * newest first.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true },
  })
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  const notes = await db.clientDealNote.findMany({
    where: { clientDealId: dealId },
    orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ notes })
}

/**
 * DELETE /api/portal/crm/deals/[id]/notes?noteId=xxx
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: dealId } = await params
  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get("noteId")
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 })

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true },
  })
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  await db.clientDealNote.deleteMany({
    where: { id: noteId, clientDealId: dealId },
  })
  return NextResponse.json({ ok: true })
}
