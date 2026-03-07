import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { generateOnboardingTasks } from "@/lib/automation/onboarding"

const schema = z.object({
  serviceArmId: z.string(),
  tier: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  monthlyAmount: z.number().min(0).default(0),
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

  const { serviceArmId, tier, clientName, clientEmail, monthlyAmount } = parsed.data

  // Find or create user
  let user = await db.user.findUnique({ where: { email: clientEmail } })
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: `simulated_${Date.now()}`,
        email: clientEmail,
        name: clientName,
        role: "CLIENT",
      },
    })
  }

  // Create subscription
  const subscription = await db.subscription.create({
    data: {
      userId: user.id,
      serviceArmId,
      tier,
      monthlyAmount,
      status: "ACTIVE",
      fulfillmentStatus: "PENDING_SETUP",
    },
  })

  // Generate onboarding tasks
  await generateOnboardingTasks({
    id: subscription.id,
    userId: user.id,
    serviceArmId,
    tier,
  })

  // Create a deal as ACTIVE_CLIENT
  const serviceArm = await db.serviceArm.findUnique({ where: { id: serviceArmId }, select: { name: true } })
  await db.deal.create({
    data: {
      contactName: clientName,
      contactEmail: clientEmail,
      stage: "ACTIVE_CLIENT",
      source: "simulate-purchase",
      sourceDetail: `Simulated purchase of ${serviceArm?.name ?? "service"}`,
      mrr: monthlyAmount,
      value: monthlyAmount,
    },
  })

  return NextResponse.json({
    success: true,
    userId: user.id,
    subscriptionId: subscription.id,
    message: `Onboarding tasks generated for ${clientName}`,
  }, { status: 201 })
}
