import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

function escapeCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(",")
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const deals = await db.clientDeal.findMany({
    where: { userId: dbUserId },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { activities: true, proposals: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const headers = [
    "Company",
    "Stage",
    "Value",
    "Currency",
    "Industry",
    "Website",
    "Contact Name",
    "Contact Email",
    "Contact Phone",
    "Tags",
    "Activities",
    "Proposals",
    "Won At",
    "Lost At",
    "Lost Reason",
    "Notes",
    "Created At",
  ]

  const lines = [
    headers.join(","),
    ...deals.map((d) => {
      const contact = d.contacts[0]
      return row([
        d.companyName,
        d.stage,
        d.value,
        d.currency,
        d.industry,
        d.website,
        contact ? `${contact.firstName} ${contact.lastName ?? ""}`.trim() : d.contactName,
        contact?.email ?? d.contactEmail,
        contact?.phone ?? d.contactPhone,
        d.tags.join("; "),
        d._count.activities,
        d._count.proposals,
        d.wonAt ? new Date(d.wonAt).toISOString().slice(0, 10) : null,
        d.lostAt ? new Date(d.lostAt).toISOString().slice(0, 10) : null,
        d.lostReason,
        d.notes,
        new Date(d.createdAt).toISOString().slice(0, 10),
      ])
    }),
  ]

  const csv = lines.join("\n")
  const filename = `crm-pipeline-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
