import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

const VALID_ROLES = ["CLIENT", "RESELLER", "INTERN"] as const
type ViewAsRole = (typeof VALID_ROLES)[number]

export const COOKIE_NAME = "__aims_view_as"

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { role } = body as { role?: string }

  if (!role || !VALID_ROLES.includes(role as ViewAsRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  })
  return res
}

export async function DELETE() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
