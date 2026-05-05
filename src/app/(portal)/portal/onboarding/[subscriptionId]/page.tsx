import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CheckCircle, Info } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import OnboardingForm from "@/components/portal/OnboardingForm"

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "url" | "textarea" | "select" | "checkbox" | "file_url"
  placeholder?: string
  required?: boolean
  options?: string[]
  helpText?: string
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const { subscriptionId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!user) redirect("/sign-in")

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { serviceArm: true },
  })

  if (!subscription || subscription.userId !== user.id) {
    redirect("/portal/services")
  }

  // Already completed
  if (subscription.onboardingCompletedAt) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Onboarding Already Completed
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            You have already submitted your onboarding form for{" "}
            {subscription.serviceArm.name}. Our team is working on setting up
            your service.
          </p>
          <Link
            href="/portal/services"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  const formSchema = subscription.serviceArm.onboardingFormSchema as
    | FormField[]
    | null

  // No form schema defined
  if (!formSchema || !Array.isArray(formSchema) || formSchema.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <div className="flex justify-center mb-4">
            <Info className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Your Service is Being Set Up
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            No additional information is needed for{" "}
            {subscription.serviceArm.name}. Our team will reach out if they need
            anything from you.
          </p>
          <Link
            href="/portal/services"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  const existingData = subscription.onboardingData as
    | Record<string, string>
    | null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/portal/services"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Services
        </Link>
      </div>

      <OnboardingForm
        subscriptionId={subscriptionId}
        serviceName={subscription.serviceArm.name}
        fields={formSchema}
        existingData={existingData ?? undefined}
      />
    </div>
  )
}
