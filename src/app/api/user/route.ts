import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Delete from Clerk first
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)

    // Delete from our DB (cascades to subscriptions, support tickets, etc.)
    await db.user.delete({ where: { clerkId: userId } }).catch(() => null)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Account deletion failed:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
