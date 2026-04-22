import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
;(async () => {
  const deals = await db.deal.findMany({
    select: {
      contactName: true,
      contactEmail: true,
      stage: true,
      source: true,
      sourceDetail: true,
      mightyMemberId: true,
      closeLeadId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  console.log(`\nALL ${deals.length} deals in CRM:\n`)
  for (const d of deals) {
    const flags = [
      d.mightyMemberId ? "MIGHTY" : "",
      d.closeLeadId ? "CLOSE" : "",
    ]
      .filter(Boolean)
      .join(",")
    console.log(
      `  ${d.createdAt.toISOString().slice(0, 10)} | ${d.stage.padEnd(22)} | ${(d.contactName ?? "—").slice(0, 24).padEnd(24)} | ${d.contactEmail.padEnd(35)} | src=${d.source ?? "—"} | ${flags}`
    )
  }
  await db.$disconnect()
})()
