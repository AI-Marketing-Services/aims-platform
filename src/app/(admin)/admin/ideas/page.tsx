import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import IdeasBoard, { type IdeaRecord } from "./IdeasBoard"

export const metadata = { title: "Ideas · Vault", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function AdminIdeasPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // DB role is the source of truth — Clerk session tokens don't always
  // include publicMetadata (session template not customized), and the
  // outer admin layout already gated us down to an authenticated user
  // who passed the middleware role check.
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  })
  if (!user) redirect("/admin/dashboard")
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin/dashboard")

  const ideas = (await db.idea.findMany({
    where: { ownerId: user.id },
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
  })) as unknown as IdeaRecord[]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
              PRIVATE · OWNER-ONLY · HIDDEN FROM SIDEBAR
            </div>
            <h1 className="font-serif text-4xl text-foreground">Ideas Vault</h1>
            <p className="text-foreground/60 text-sm mt-1">
              Your capture surface for products, lead magnets, copy, and bets. Ideas are private to each admin — nobody else sees yours.
            </p>
          </div>
          <div className="font-mono text-[10px] text-foreground/40">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </div>
        </div>

        <IdeasBoard initial={ideas} />
      </div>
    </div>
  )
}
