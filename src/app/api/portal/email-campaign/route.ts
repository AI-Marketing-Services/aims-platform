import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getWorkspaceDashboard } from "@/lib/emailbison"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { emailBisonConnection: true },
  })

  if (!user?.emailBisonConnection) {
    return NextResponse.json({ connected: false })
  }

  try {
    const dashboard = await getWorkspaceDashboard(user.emailBisonConnection.workspaceId)
    return NextResponse.json({
      connected: true,
      workspaceName: user.emailBisonConnection.workspaceName,
      ...dashboard,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
