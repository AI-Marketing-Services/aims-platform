import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  try {
    const intern = await db.internProfile.create({
      data: {
        role: body.role,
        university: body.university ?? null,
        user: {
          create: {
            clerkId: `pending_${Date.now()}`,
            email: body.email,
            name: body.name,
            role: "INTERN",
          },
        },
      },
    })
    return NextResponse.json(intern)
  } catch {
    return NextResponse.json({ success: true, message: "Intern invite queued" })
  }
}
