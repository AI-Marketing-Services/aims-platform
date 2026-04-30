import { NextRequest, NextResponse } from "next/server"
import {
  updateExistingLessons,
  createMissingLessons,
} from "@/lib/mighty/content-pipeline"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

/**
 * POST /api/admin/mighty/update-courses
 * Updates existing lesson content and creates lessons in empty sections.
 *
 * Body:
 *   - spaceId?: number          — Mighty Networks space ID (default: 23411754)
 *   - updateExisting?: boolean  — Update existing lesson descriptions (default: true)
 *   - createMissing?: boolean   — Create lessons in empty sections (default: true)
 */
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const spaceId: number = body.spaceId ?? 23411754
    const shouldUpdateExisting: boolean = body.updateExisting ?? true
    const shouldCreateMissing: boolean = body.createMissing ?? true

    let existingResult: { updated: number; skipped: number; notFound: string[] } | null = null
    let missingResult: { created: number; failed: string[] } | null = null

    if (shouldUpdateExisting) {
      existingResult = await updateExistingLessons(spaceId)
    }

    if (shouldCreateMissing) {
      missingResult = await createMissingLessons(spaceId)
    }

    logger.info("[Mighty] Content update complete", {
      action: "updateCourses",
      userId,
      existingUpdated: existingResult?.updated ?? 0,
      missingCreated: missingResult?.created ?? 0,
    })

    return NextResponse.json({
      success: true,
      data: {
        existing: existingResult,
        missing: missingResult,
      },
    })
  } catch (err) {
    logger.error("[Mighty] Content update failed", err)
    return NextResponse.json(
      { error: "Content update failed" },
      { status: 500 }
    )
  }
}
