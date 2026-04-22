import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
;(async () => {
  const users = await db.user.findMany({
    where: { email: { in: ["adamwolfe100@gmail.com", "adamwolfe102@gmail.com"] } },
    select: { id: true, email: true, role: true, clerkId: true },
  })
  console.log(users)
  await db.$disconnect()
})()
