import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

async function verifyProposalOwner(proposalId: string, userId: string) {
  const proposal = await db.clientProposal.findFirst({
    where: { id: proposalId, clientDeal: { userId } },
  })
  return proposal
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { proposalId } = await params
  const proposal = await verifyProposalOwner(proposalId, dbUserId)
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const { title, content, status } = body as {
      title?: string
      content?: string
      status?: string
    }

    const updated = await db.clientProposal.update({
      where: { id: proposalId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(status === "SENT" ? { sentAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ proposal: updated })
  } catch (err) {
    logger.error("Failed to update proposal", err, { userId, proposalId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { proposalId } = await params
  const proposal = await verifyProposalOwner(proposalId, dbUserId)
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.clientProposal.delete({ where: { id: proposalId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete proposal", err, { userId, proposalId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
