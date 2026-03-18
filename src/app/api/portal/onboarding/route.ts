import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, data } = body as {
      subscriptionId: string
      data: Record<string, string>
    }

    if (!subscriptionId || !data) {
      return NextResponse.json(
        { error: "subscriptionId and data are required" },
        { status: 400 }
      )
    }

    // Verify the subscription belongs to the authenticated user
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, userId: true, serviceArmId: true },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    if (subscription.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Store onboarding data and mark as completed
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        onboardingData: data,
        onboardingCompletedAt: new Date(),
        fulfillmentStatus: "IN_PROGRESS",
      },
    })

    // Create a notification for the admin team
    await db.notification.create({
      data: {
        channel: "IN_APP",
        type: "ONBOARDING_COMPLETED",
        title: "Client onboarding completed",
        message: `Onboarding form submitted for subscription ${subscriptionId}. Service setup can begin.`,
        metadata: {
          subscriptionId,
          userId: user.id,
          serviceArmId: subscription.serviceArmId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptionId = req.nextUrl.searchParams.get("subscriptionId")
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { serviceArm: true },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    if (subscription.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      onboardingData: subscription.onboardingData,
      onboardingCompletedAt: subscription.onboardingCompletedAt,
      formSchema: subscription.serviceArm.onboardingFormSchema,
      serviceName: subscription.serviceArm.name,
    })
  } catch (error) {
    console.error("Onboarding GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
