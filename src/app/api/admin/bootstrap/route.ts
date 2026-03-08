import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"

const ADMIN_EMAILS = ["adam@modern-amenities.com", "adamwolfe102@gmail.com"]

export async function GET() {
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({ limit: 100 })

  const results = []
  for (const user of users) {
    const email = user.emailAddresses[0]?.emailAddress
    if (email && ADMIN_EMAILS.includes(email)) {
      await client.users.updateUser(user.id, {
        publicMetadata: { role: "ADMIN" },
      })
      results.push({ email, role: "ADMIN", status: "updated" })
    }
  }

  return NextResponse.json({ success: true, updated: results })
}
