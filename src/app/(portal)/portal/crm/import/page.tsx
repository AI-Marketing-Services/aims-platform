import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ImportWizard } from "@/components/portal/crm/ImportWizard"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function CrmImportPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { creditBalance: true },
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      <Link
        href="/portal/crm"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to pipeline
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Import leads from CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop in an export from HubSpot, Pipedrive, Close, Google Sheets, or
          any spreadsheet. We dedup against your existing CRM, map the columns
          for you, and optionally auto-enrich every imported deal in one pass.
        </p>
      </div>

      <ImportWizard creditBalance={dbUser?.creditBalance ?? 0} />
    </div>
  )
}
