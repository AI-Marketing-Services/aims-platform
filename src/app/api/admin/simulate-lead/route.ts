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

  const { name, email, type, score } = await req.json()

  if (!name || !email || !type) {
    return NextResponse.json({ error: "name, email, and type are required" }, { status: 400 })
  }

  const validTypes = [
    "AI_READINESS_QUIZ",
    "ROI_CALCULATOR",
    "WEBSITE_AUDIT",
    "SEGMENT_EXPLORER",
    "STACK_CONFIGURATOR",
  ]

  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid lead magnet type" }, { status: 400 })
  }

  try {
    const submission = await db.leadMagnetSubmission.create({
      data: {
        name,
        email,
        type,
        score: score ?? null,
        data: { simulated: true, score },
      },
    })

    const deal = await db.deal.create({
      data: {
        contactName: name,
        contactEmail: email,
        stage: "NEW_LEAD",
        leadScore: score ?? 0,
        channelTag: type.toLowerCase(),
        value: 0,
        source: "simulate-lead",
        sourceDetail: `Simulated ${type} submission`,
      },
    })

    // Fire an in-app notification
    await db.notification
      .create({
        data: {
          type: "new_lead",
          title: `[SIMULATED] New Lead — ${type.replace(/_/g, " ")}`,
          message: `${name} (${email}) submitted ${type.replace(/_/g, " ")} with score ${score ?? "N/A"}`,
          channel: "IN_APP",
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true, submission, deal }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "DB error", details: String(e) }, { status: 500 })
  }
}
