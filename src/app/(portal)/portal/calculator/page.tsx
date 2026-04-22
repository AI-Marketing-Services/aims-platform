import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PricingCalculator } from "@/components/portal/calculator/PricingCalculator"
import { Calculator } from "lucide-react"

export default async function CalculatorPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Pricing Calculator</h1>
          <p className="text-xs text-muted-foreground">
            Build a professional pricing breakdown for any AI automation project
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <PricingCalculator />
      </div>
    </div>
  )
}
