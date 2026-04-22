import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
;(async () => {
  const deals = await db.deal.findMany({
    where: { source: "close-import", closeLeadId: { not: null } },
    select: { contactName: true, contactEmail: true, stage: true, closeLeadId: true },
    orderBy: { contactName: "asc" },
  })
  console.log(`\n${deals.length} Close-imported deals:\n`)
  for (const d of deals) {
    console.log(
      `  • ${(d.contactName ?? "—").padEnd(22)} | ${d.contactEmail.padEnd(34)} | ${d.stage.padEnd(8)} | https://app.close.com/lead/${d.closeLeadId}/`
    )
  }
  await db.$disconnect()
})()
