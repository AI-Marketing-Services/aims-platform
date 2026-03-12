import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getWorkspaces } from "@/lib/emailbison"

export async function GET() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const workspaces = await getWorkspaces()
    return NextResponse.json({ workspaces })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
