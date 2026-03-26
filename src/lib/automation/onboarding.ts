import { db } from "@/lib/db"
import { notifyNewPurchase } from "@/lib/notifications"
import { logger } from "@/lib/logger"

export async function generateOnboardingTasks(subscription: {
  id: string
  userId: string
  serviceArmId: string
  tier?: string
}) {
  const serviceArm = await db.serviceArm.findUnique({
    where: { id: subscription.serviceArmId },
  })

  if (!serviceArm) return

  type SetupStep = { title: string; description?: string; assignedTo?: string; priority?: string }
  const setupSteps: SetupStep[] = Array.isArray(serviceArm.setupSteps)
    ? (serviceArm.setupSteps as SetupStep[])
    : getDefaultSetupSteps(serviceArm.name)

  const tasks = setupSteps.map((step, i) => ({
    subscriptionId: subscription.id,
    title: step.title,
    description: step.description ?? null,
    status: "todo",
    assignedTo: step.assignedTo ?? serviceArm.defaultAssignee ?? "adam",
    priority: i === 0 ? "high" : "medium",
    dueDate: new Date(Date.now() + (i + 1) * 2 * 86400000),
  }))

  if (tasks.length > 0) {
    await db.fulfillmentTask.createMany({ data: tasks })
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: { fulfillmentStatus: "IN_PROGRESS" },
  })

  const user = await db.user.findUnique({
    where: { id: subscription.userId },
    select: { name: true, email: true },
  })

  await notifyNewPurchase({
    clientName: user?.name ?? user?.email ?? "New Client",
    serviceName: serviceArm.name,
    tier: subscription.tier ?? undefined,
    amount: 0,
  }).catch((err) => logger.error("Onboarding notification failed", err))
}

function getDefaultSetupSteps(serviceName: string): { title: string; description?: string }[] {
  const lower = serviceName.toLowerCase()

  if (lower.includes("website") || lower.includes("crm")) {
    return [
      { title: "Discovery call scheduled", description: "30-min call to capture branding, copy, and goals" },
      { title: "GoHighLevel sub-account created", description: "Create GHL sub-account and configure basic settings" },
      { title: "Website template deployed", description: "Deploy and customize the website template" },
      { title: "AI chatbot trained", description: "Train chatbot on client FAQs, services, and pricing" },
      { title: "CRM pipeline configured", description: "Set up deal stages, automations, and contact fields" },
      { title: "Client onboarding call", description: "Walk client through their new dashboard" },
    ]
  }

  if (lower.includes("outbound") || lower.includes("cold email")) {
    return [
      { title: "ICP workshop completed", description: "Define ideal customer profile, industries, titles, signals" },
      { title: "Domain acquisition and setup", description: "Purchase 3-5 sending domains, configure DNS, SPF/DKIM/DMARC" },
      { title: "Email warmup started", description: "Begin domain warmup (10-14 days)" },
      { title: "Clay enrichment workflow built", description: "Build lead list with Clay enrichment waterfall" },
      { title: "Sequences written and loaded", description: "Write 3-step sequences with AI personalization variables" },
      { title: "Campaigns launched", description: "Start campaigns at 20-30 emails/domain/day" },
    ]
  }

  if (lower.includes("voice") || lower.includes("agent")) {
    return [
      { title: "Call routing audit", description: "Map current call flow and identify AI agent touchpoints" },
      { title: "Agent script written", description: "Write and approve inbound + outbound agent scripts" },
      { title: "Phone number provisioned", description: "Set up Twilio/VAPI number with routing rules" },
      { title: "Agent trained and tested", description: "Run 20+ test calls, refine responses" },
      { title: "Go live", description: "Flip calls to AI agent, monitor first 48 hours" },
    ]
  }

  // Generic default
  return [
    { title: "Kickoff call scheduled" },
    { title: "Access credentials gathered" },
    { title: "Setup and configuration" },
    { title: "Testing and review" },
    { title: "Client handoff call" },
  ]
}
