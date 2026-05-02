import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import {
  getUserProgress,
  recordDailyLogin,
  seedDayZero,
} from "@/lib/quests"
import { QuestsClient } from "./QuestsClient"

export const metadata: Metadata = {
  title: "Quests · AI Operator Collective",
  description: "Your operator journey — unlock new features as you grow.",
}

export const dynamic = "force-dynamic"

export default async function QuestsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await getOrCreateDbUserByClerkId(clerkId)

  // Seed day-zero quests (idempotent) + record streak before reading progress
  await Promise.all([
    seedDayZero(dbUser.id).catch(() => {}),
    recordDailyLogin(dbUser.id).catch(() => {}),
  ])

  const progress = await getUserProgress(dbUser.id)

  return <QuestsClient initialProgress={progress} />
}
