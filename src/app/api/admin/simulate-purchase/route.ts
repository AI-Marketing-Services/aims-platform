import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { generateOnboardingTasks } from "@/lib/automation/onboarding"
import { notifyNewPurchase } from "@/lib/notifications"

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
  const deal = await db.deal.create({
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

  // Count tasks created
  const taskCount = await db.fulfillmentTask.count({ where: { subscriptionId: subscription.id } })

  // Fire notification
  let notificationId: string | null = null
  try {
    const notif = await db.notification.create({
      data: {
        type: "new_purchase",
        title: `[SIMULATED] New Purchase — ${serviceArm?.name ?? "Service"}`,
        message: `${clientName} (${clientEmail}) subscribed at $${monthlyAmount}/mo`,
        channel: "IN_APP",
      },
    })
    notificationId = notif.id
    await notifyNewPurchase({
      clientName,
      serviceName: `[SIMULATED] ${serviceArm?.name ?? "service"}`,
      amount: monthlyAmount,
    }).catch(() => {})
  } catch {}

  return NextResponse.json({
    success: true,
    userId: user.id,
    subscriptionId: subscription.id,
    dealId: deal.id,
    taskCount,
    notificationId,
    serviceName: serviceArm?.name,
    message: `Onboarding tasks generated for ${clientName}`,
  }, { status: 201 })
}
