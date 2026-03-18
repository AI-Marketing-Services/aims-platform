import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"

const ADMIN_EMAILS = ["adam@modern-amenities.com", "adamwolfe102@gmail.com"]

export async function GET(req: Request) {
  // Require a secret token so this endpoint cannot be triggered by anonymous users.
  // Set BOOTSTRAP_SECRET in your env vars and pass it as ?secret=<value>
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")

  if (!process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Bootstrap not configured" }, { status: 500 })
  }

  if (secret !== process.env.BOOTSTRAP_SECRET) {
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
          publicMetadata: { role: "ADMIN" },
        })
        results.push({ email, role: "ADMIN", status: "updated" })
      }
    }

    return NextResponse.json({ success: true, updated: results })
  } catch (err) {
    console.error("Bootstrap failed:", err)
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 })
  }
}
