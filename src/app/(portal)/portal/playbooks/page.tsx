import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PLAYBOOK_MANIFEST } from "@/lib/playbooks/manifest"
import { PlaybooksView } from "@/components/portal/playbooks/PlaybooksView"
import { BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PlaybooksPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Industry Playbooks</h1>
          <p className="text-xs text-muted-foreground">
            What to pitch, how to price it, and what tools to use — by industry
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <PlaybooksView playbooks={PLAYBOOK_MANIFEST} />
      </div>
    </div>
  )
}
