import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const start = Date.now()
  let dbOk = false

  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    // DB unreachable
  }

  const status = dbOk ? "ok" : "degraded"
  const code = dbOk ? 200 : 503

  return NextResponse.json(
    {
      status,
      db: dbOk,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    },
    {
      status: code,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
