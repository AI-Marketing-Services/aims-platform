import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

/**
 * POST /api/admin/mighty/update-courses
 *
 * Stub: the underlying `updateExistingLessons` / `createMissingLessons`
 * helpers from content-pipeline were removed during a refactor and
 * never replaced. Returns 410 Gone until they're rebuilt. Kept the
 * route file so existing scripts that hit this URL get a sensible
 * error rather than a Next.js 404.
 */
export async function POST(_req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(
    {
      error: "This endpoint is currently disabled.",
      detail:
        "The content-pipeline helpers backing this route were removed during a refactor and have not been rebuilt yet.",
    },
    { status: 410 },
  )
}
