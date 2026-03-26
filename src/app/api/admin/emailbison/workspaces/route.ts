import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getWorkspaces } from "@/lib/emailbison"
import { logger } from "@/lib/logger"

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const workspaces = await getWorkspaces()
    return NextResponse.json({ workspaces })
  } catch (err) {
    logger.error("Failed to fetch Email Bison workspaces:", err)
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 })
  }
}
