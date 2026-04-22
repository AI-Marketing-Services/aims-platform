import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
;(async () => {
  const users = await db.user.findMany({
    where: {
      OR: [
        { email: { in: ["adamwolfe100@gmail.com", "adamwolfe102@gmail.com"] } },
        { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      ],
    },
    select: { id: true, email: true, role: true, clerkId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  console.log("All admin-capable users + Adam emails:")
  for (const u of users) {
    console.log(
      `  ${u.email.padEnd(30)} | role=${u.role.padEnd(12)} | clerkId=${u.clerkId} | created=${u.createdAt.toISOString()}`
    )
  }
  await db.$disconnect()
})()
