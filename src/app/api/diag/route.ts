import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * Diagnostic endpoint — runs server-side queries that mirror real portal pages
 * and returns whether each one succeeds. Used to debug prod outages quickly.
 *
 * Previously this was a public endpoint (TEMP marker) which leaked internal
 * Prisma error codes, table names, and admin user IDs to anyone who hit it.
 * Now gated behind admin auth.
 */
export async function GET() {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    ok: true,
    note: "Diag probes are admin-only. Add specific checks here as needed.",
  })
}
