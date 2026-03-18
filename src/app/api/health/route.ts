import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()
  let dbOk = false

  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch (err) {
    console.error("[health] DB check failed:", err)
  }

  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    timestamp: new Date().toISOString(),
    latency: Date.now() - start,
  }, { status: dbOk ? 200 : 503 })
}
