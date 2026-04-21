import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import IdeasBoard, { type IdeaRecord } from "./IdeasBoard"
import UnlockForm from "./UnlockForm"

export const metadata = { title: "Lead Magnets", robots: { index: false } }
export const dynamic = "force-dynamic"

const VAULT_COOKIE = "lead_magnets_unlock"
// Shared vault — all unlocked admins see the same board.
// Seeded to adamwolfe102; can be overridden via LEAD_MAGNETS_OWNER_EMAIL env.
const DEFAULT_OWNER_EMAIL = "adamwolfe102@gmail.com"

export default async function AdminLeadMagnetsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin/dashboard")

  const store = await cookies()
  const unlocked = store.get(VAULT_COOKIE)?.value === "yes"

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <UnlockForm />
        </div>
      </div>
    )
  }

  // Resolve the shared vault owner (Adam's account).
  const ownerEmail = process.env.LEAD_MAGNETS_OWNER_EMAIL ?? DEFAULT_OWNER_EMAIL
  const owner = await db.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true },
  })

  const ideas = owner
    ? ((await db.idea.findMany({
        where: { ownerId: owner.id },
        orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
      })) as unknown as IdeaRecord[])
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
              LEAD MAGNETS · IDEATION VAULT
            </div>
            <h1 className="font-serif text-4xl text-foreground">Lead Magnets</h1>
            <p className="text-foreground/60 text-sm mt-1">
              Concepts, products, courses, and flywheel plays. Password-protected — only unlocked team members can see this.
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
