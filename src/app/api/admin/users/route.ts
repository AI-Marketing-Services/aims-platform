import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * List every Clerk user with their role (pulled from publicMetadata).
 * Used by /admin/users so the admin team can see who has admin access
 * + promote/demote teammates without touching the Clerk dashboard.
 */
export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const clerk = await clerkClient()
    const list = await clerk.users.getUserList({ limit: 100 })

    const users = list.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "",
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl,
      role: (u.publicMetadata as { role?: string })?.role ?? "CLIENT",
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ users, total: list.totalCount })
  } catch (err) {
    logger.error("List users failed", err)
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 })
  }
}
