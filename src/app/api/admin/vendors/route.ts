import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  if (!body.vendorName || typeof body.monthlyCost !== "number" || !body.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const vendor = await db.vendorTracker.create({
      data: {
        vendorName: String(body.vendorName),
        monthlyCost: Number(body.monthlyCost),
        category: String(body.category),
        replacementName: body.replacementName ? String(body.replacementName) : null,
        projectedSavings: Number(body.projectedSavings) || 0,
        notes: body.notes ? String(body.notes) : null,
      },
    })
    return NextResponse.json(vendor)
  } catch (err) {
    console.error("Vendor create error:", err)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}
