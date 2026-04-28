import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import PDFDocument from "pdfkit"
import path from "path"
import fs from "fs"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

/** Strip markdown syntax to produce clean plain text paragraphs. */
function stripMarkdown(md: string): string[] {
  const lines = md.split("\n")
  const paragraphs: string[] = []
  let current = ""

  for (const raw of lines) {
    const line = raw
      .replace(/^#{1,6}\s+/, "")         // headings
      .replace(/\*\*(.*?)\*\*/g, "$1")   // bold
      .replace(/\*(.*?)\*/g, "$1")       // italic
      .replace(/~~(.*?)~~/g, "$1")       // strikethrough
      .replace(/`([^`]+)`/g, "$1")       // inline code
      .replace(/^\s*[-*+]\s+/, "• ")     // ul bullets
      .replace(/^\s*\d+\.\s+/, "")       // ol items
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/^\s*>\s?/, "")           // blockquotes
      .trim()

    if (line === "") {
      if (current.trim()) {
        paragraphs.push(current.trim())
        current = ""
      }
    } else {
      current += (current ? " " : "") + line
    }
  }

  if (current.trim()) paragraphs.push(current.trim())
  return paragraphs
}

function loadFonts(doc: PDFKit.PDFDocument) {
  const fontsDir = path.join(process.cwd(), "public", "fonts")

  const interPath = path.join(fontsDir, "Inter-Variable.ttf")
  const playfairPath = path.join(fontsDir, "PlayfairDisplay-Variable.ttf")

  if (fs.existsSync(interPath)) doc.registerFont("Inter", interPath)
  if (fs.existsSync(playfairPath)) doc.registerFont("Playfair", playfairPath)
}

function applyInter(doc: PDFKit.PDFDocument) {
  try { doc.font("Inter") } catch { doc.font("Helvetica") }
}

function applyPlayfair(doc: PDFKit.PDFDocument) {
  try { doc.font("Playfair") } catch { doc.font("Times-Roman") }
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

interface ProposalData {
  title: string
  content: string
  totalValue: number
  currency: string
  createdAt: Date
  clientDeal: {
    companyName: string
    user: {
      memberProfile: {
        businessName: string | null
        brandColor: string | null
        tagline: string | null
      } | null
    }
  }
}

function buildProposalPDF(proposal: ProposalData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M = { top: 56, bottom: 56, left: 64, right: 64 }
    const PW = 612
    const CW = PW - M.left - M.right

    const profile = proposal.clientDeal.user.memberProfile
    const businessName = profile?.businessName ?? "AI Operator"
    const tagline = profile?.tagline ?? ""
    const brandColor = profile?.brandColor ?? "#C4972A"

    const C = {
      brand: brandColor as string,
      ink: "#08090D" as string,
      body: "#2D2D2D" as string,
      muted: "#6B7280" as string,
      border: "#E5E7EB" as string,
      bg: "#F9FAFB" as string,
      white: "#FFFFFF" as string,
    }

    const doc = new PDFDocument({
      size: "LETTER",
      margins: M,
      bufferPages: true,
      info: {
        Title: proposal.title,
        Author: businessName,
        Subject: `Proposal for ${proposal.clientDeal.companyName}`,
      },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    loadFonts(doc)

    const formattedDate = new Date(proposal.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // ── HEADER BLOCK ─────────────────────────────────────────────────────────
    // Top brand accent bar
    doc.rect(0, 0, PW, 4).fill(brandColor)

    // Business name
    applyPlayfair(doc)
    doc.fontSize(22).fillColor(brandColor).text(businessName, M.left, 36, { width: CW })

    // Tagline
    if (tagline) {
      applyInter(doc)
      doc.fontSize(10).fillColor(C.muted).text(tagline, M.left, doc.y + 4, { width: CW })
    }

    // Divider in brand color
    const divY = (tagline ? doc.y : doc.y) + 12
    doc.moveTo(M.left, divY).lineTo(PW - M.right, divY).lineWidth(1.5).strokeColor(brandColor).stroke()

    // ── PROPOSAL TITLE & META ─────────────────────────────────────────────────
    const titleY = divY + 24
    applyPlayfair(doc)
    doc.fontSize(28).fillColor(C.ink).text(proposal.title, M.left, titleY, { width: CW })

    applyInter(doc)
    doc.fontSize(10).fillColor(C.muted)
    doc.text(
      `Prepared for: ${proposal.clientDeal.companyName}     |     Date: ${formattedDate}`,
      M.left,
      doc.y + 8,
      { width: CW }
    )

    // Second divider (thin)
    const div2Y = doc.y + 14
    doc.moveTo(M.left, div2Y).lineTo(PW - M.right, div2Y).lineWidth(0.5).strokeColor(C.border).stroke()

    // ── CONTENT ───────────────────────────────────────────────────────────────
    const contentY = div2Y + 20
    doc.y = contentY

    const paragraphs = stripMarkdown(proposal.content)

    for (const para of paragraphs) {
      const isBullet = para.startsWith("• ")
      const isHeading = para.length < 80 && para === para.toUpperCase() && para.length > 2

      if (doc.y + 30 > doc.page.height - M.bottom) doc.addPage()

      if (isHeading) {
        applyPlayfair(doc)
        doc.fontSize(14).fillColor(brandColor)
        doc.text(para, M.left, doc.y + 6, { width: CW })
        doc.moveDown(0.3)
      } else if (isBullet) {
        applyInter(doc)
        doc.fontSize(9.5).fillColor(brandColor).text("•  ", M.left + 4, doc.y, { continued: true })
        doc.fillColor(C.body).text(para.slice(2), { width: CW - 16, lineGap: 3 })
        doc.moveDown(0.2)
      } else {
        applyInter(doc)
        doc.fontSize(10).fillColor(C.body)
        doc.text(para, M.left, doc.y + 2, { width: CW, lineGap: 4 })
        doc.moveDown(0.5)
      }
    }

    // ── TOTAL VALUE ───────────────────────────────────────────────────────────
    if (proposal.totalValue > 0) {
      if (doc.y + 70 > doc.page.height - M.bottom) doc.addPage()

      const tvY = doc.y + 16
      const tvBoxH = 48

      doc.roundedRect(M.left, tvY, CW, tvBoxH, 4).fill(C.bg)
      doc.rect(M.left, tvY, 3, tvBoxH).fill(brandColor)

      applyInter(doc)
      doc.fontSize(8.5)
        .fillColor(C.muted)
        .text("TOTAL VALUE", M.left + 16, tvY + 10, { characterSpacing: 1.5 })

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: proposal.currency || "USD",
        minimumFractionDigits: 0,
      }).format(proposal.totalValue)

      applyPlayfair(doc)
      doc.fontSize(20).fillColor(brandColor).text(formatted, M.left + 16, doc.y + 3)

      doc.y = tvY + tvBoxH + 12
    }

    // ── FOOTER (all pages) ─────────────────────────────────────────────────────
    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)
      const savedBottom = doc.page.margins.bottom
      doc.page.margins.bottom = 0

      doc
        .moveTo(M.left, doc.page.height - 38)
        .lineTo(PW - M.right, doc.page.height - 38)
        .lineWidth(0.4)
        .strokeColor(C.border)
        .stroke()

      applyInter(doc)
      doc.fontSize(7).fillColor(C.muted)
      doc.text(`Confidential — ${businessName}`, M.left, doc.page.height - 30, { lineBreak: false })
      doc.text(formattedDate, PW - M.right - 100, doc.page.height - 30, {
        lineBreak: false,
        width: 100,
        align: "right",
      })

      // Page number
      doc.text(`${i + 1} / ${range.count}`, PW / 2 - 30, doc.page.height - 30, {
        lineBreak: false,
        width: 60,
        align: "center",
      })

      doc.page.margins.bottom = savedBottom
    }

    doc.flushPages()
    doc.end()
  })
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { proposalId } = await params

  const proposal = await db.clientProposal.findFirst({
    where: {
      id: proposalId,
      clientDeal: { userId: dbUserId },
    },
    include: {
      clientDeal: {
        include: {
          user: {
            include: {
              memberProfile: {
                select: {
                  businessName: true,
                  brandColor: true,
                  tagline: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const pdfBuffer = await buildProposalPDF(proposal)

    const safeName = proposal.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)

    const filename = `proposal-${safeName}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    })
  } catch (err) {
    logger.error("Failed to generate proposal PDF", err, { userId, proposalId })
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
