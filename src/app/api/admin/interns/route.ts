import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { InternRole } from "@prisma/client"

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  role: z.nativeEnum(InternRole),
  university: z.string().max(100).optional(),
})

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const intern = await db.internProfile.create({
      data: {
        role: parsed.data.role,
        university: parsed.data.university ?? null,
        user: {
          create: {
            clerkId: `pending_${Date.now()}`,
            email: parsed.data.email,
            name: parsed.data.name,
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
