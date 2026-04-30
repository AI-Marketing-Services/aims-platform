import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { ScriptDetailClient } from "./ScriptDetailClient"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

async function getScript(scriptId: string, clerkId: string) {
  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!dbUser) return null
  return db.aiScript.findFirst({
    where: { id: scriptId, userId: dbUser.id },
    include: {
      clientDeal: { select: { id: true, companyName: true, contactName: true } },
    },
  })
}

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const { id } = await params
  const script = await getScript(id, clerkId)
  if (!script) notFound()

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <Link
        href="/portal/scripts"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to scripts
      </Link>

      <ScriptDetailClient
        scriptId={script.id}
        initialTitle={script.title}
        initialContent={script.content}
        scriptType={script.type}
        linkedDeal={
          script.clientDeal
            ? {
                id: script.clientDeal.id,
                companyName: script.clientDeal.companyName,
                contactName: script.clientDeal.contactName,
              }
            : null
        }
        createdAt={script.createdAt.toISOString()}
        updatedAt={script.updatedAt.toISOString()}
      />
    </div>
  )
}
