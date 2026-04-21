import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Hardcoded per explicit user direction. Cosmetic gate — intentionally
// simple so team members can't stumble into Adam's idea board.
const VAULT_PASSWORD = "tools"
const COOKIE_NAME = "lead_magnets_unlock"
const MAX_AGE_DAYS = 30

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const pw = typeof body?.password === "string" ? body.password.trim() : ""
    if (pw !== VAULT_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 })
    }
    const store = await cookies()
    store.set(COOKIE_NAME, "yes", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
