import { Library } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { TemplatesClient } from "./TemplatesClient"

export const metadata = { title: "Templates" }
export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  const dbUser = await ensureDbUser()

  // Pull both private (this user) and public (curated by platform admins).
  // The client decides which list to show via tab state.
  const templates = await db.userTemplate.findMany({
    where: { OR: [{ userId: dbUser.id }, { isPublic: true }] },
    orderBy: [{ isPublic: "asc" }, { updatedAt: "desc" }],
  })

  const serialized = templates.map((t) => ({
    id: t.id,
    type: t.type,
    title: t.title,
    body: t.body,
    variables: t.variables,
    tags: t.tags,
    isPublic: t.isPublic,
    isMine: t.userId === dbUser.id,
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Library className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates Library</h1>
          <p className="text-sm text-muted-foreground">
            Reusable emails, proposals, scripts, and content blocks. Save once,
            use everywhere.
          </p>
        </div>
      </div>

      <TemplatesClient initialTemplates={serialized} />
    </div>
  )
}
