import { auth } from "@clerk/nextjs/server"

export async function requireAdmin(): Promise<string | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}
