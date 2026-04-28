import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// Temporary diagnostic endpoint — runs a few Prisma queries and returns the
// raw error code / meta so we can see what's failing on Vercel runtime that
// the truncated log viewer is hiding. Public on purpose — no sensitive data
// is returned. DELETE THIS FILE once the prod outage is fixed.
export async function GET() {
  const result: Record<string, unknown> = {
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      databaseUrlHost:
        process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] ?? null,
      nodeEnv: process.env.NODE_ENV,
      prismaClientVersion:
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require("@prisma/client/package.json") as { version?: string }).version,
    },
  }

  for (const [label, run] of [
    ["userCount", () => db.user.count()],
    ["auditQuizCount", () => db.auditQuiz.count()],
    ["portalFeedbackCount", () => db.portalFeedback.count()],
    ["aiScriptCount", () => db.aiScript.count()],
    ["followUpRuleCount", () => db.followUpRule.count()],
  ] as const) {
    try {
      result[label] = { ok: true, value: await run() }
    } catch (err) {
      const e = err as {
        message?: string
        name?: string
        code?: string
        meta?: unknown
        clientVersion?: string
      }
      result[label] = {
        ok: false,
        name: e.name,
        code: e.code,
        meta: e.meta,
        clientVersion: e.clientVersion,
        message: e.message?.split("\n").slice(0, 4).join(" | "),
      }
    }
  }

  return NextResponse.json(result, { status: 200 })
}
