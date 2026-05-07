import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { logger } from "@/lib/logger"

const ADMIN_EMAILS = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "adam@modern-amenities.com,adamwolfe102@gmail.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

export async function POST(req: Request) {
  // Defense-in-depth: even if BOOTSTRAP_SECRET leaks, this endpoint is a
  // black hole in production unless explicitly enabled by setting
  // ALLOW_BOOTSTRAP=1. Bootstrap is a one-time op, so the env flag should
  // be unset again immediately after promoting the first admin.
  // Use VERCEL_ENV (not NODE_ENV) — Vercel sets NODE_ENV=production for both
  // Production AND Preview deploys; we want to allow bootstrap on preview.
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    (process.env.VERCEL_ENV == null && process.env.NODE_ENV === "production")
  if (isProduction && process.env.ALLOW_BOOTSTRAP !== "1") {
    return new Response(null, { status: 404 })
  }

  // Require a secret token via Authorization header (POST-only for sensitive operations)
  const authHeader = req.headers.get("authorization")

  if (!process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Bootstrap not configured" }, { status: 500 })
  }

  if (authHeader !== `Bearer ${process.env.BOOTSTRAP_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({ limit: 100 })

    const results = []
    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress
      if (email && ADMIN_EMAILS.includes(email)) {
        await client.users.updateUser(user.id, {
          publicMetadata: { role: "SUPER_ADMIN" },
        })
        results.push({ email, role: "SUPER_ADMIN", status: "updated" })
      }
    }

    return NextResponse.json({ success: true, updated: results })
  } catch (err) {
    logger.error("Bootstrap failed:", err)
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 })
  }
}
