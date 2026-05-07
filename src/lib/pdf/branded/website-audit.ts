import PDFDocument from "pdfkit"
import path from "path"
import fs from "fs"
import type { BrandTokens, WebsiteAuditPDFInput } from "./types"

const M = { top: 50, bottom: 50, left: 56, right: 56 }
const PW = 612 // US Letter width
const CW = PW - M.left - M.right

function loadFonts(doc: PDFKit.PDFDocument) {
  const fontsDir = path.join(process.cwd(), "public", "fonts")
  const interPath = path.join(fontsDir, "Inter-Variable.ttf")
  const playfairPath = path.join(fontsDir, "PlayfairDisplay-Variable.ttf")
  if (fs.existsSync(interPath)) doc.registerFont("Inter", interPath)
  if (fs.existsSync(playfairPath)) doc.registerFont("Playfair", playfairPath)
}

function applyInter(doc: PDFKit.PDFDocument) {
  try {
    doc.font("Inter")
  } catch {
    doc.font("Helvetica")
  }
}

function applyPlayfair(doc: PDFKit.PDFDocument) {
  try {
    doc.font("Playfair")
  } catch {
    doc.font("Times-Roman")
  }
}

/**
 * Score → severity color (good / moderate / critical). Independent of
 * the operator's brand color so a low audit score still reads as red,
 * not as a misleading on-brand pass.
 */
function scoreColor(score: number): string {
  if (score >= 70) return "#15803D" // green
  if (score >= 40) return "#B45309" // amber
  return "#B91C1C" // red
}

function severityLabel(score: number): string {
  if (score >= 70) return "Healthy"
  if (score >= 40) return "Needs work"
  return "Critical"
}

/**
 * Build a branded Website Audit PDF. Pure render — fully deterministic,
 * suitable for caching when audit + tokens are stable.
 */
export async function buildBrandedWebsiteAuditPDF(
  brand: BrandTokens,
  input: WebsiteAuditPDFInput,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: M,
    bufferPages: true,
    info: {
      Title: `Website Audit — ${input.url}`,
      Author: brand.businessName,
      Subject: "Website performance audit",
      Creator: brand.businessName,
    },
  })

  loadFonts(doc)

  const buffers: Buffer[] = []
  doc.on("data", (c) => buffers.push(c as Buffer))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)))
    doc.on("error", reject)
  })

  // ────── HEADER ──────
  drawHeader(doc, brand)

  // ────── COVER ──────
  doc.moveDown(2)
  applyPlayfair(doc)
  doc.fontSize(34).fillColor("#1A1A1A").text("Website Audit", { align: "left" })
  applyInter(doc)
  doc
    .moveDown(0.4)
    .fontSize(13)
    .fillColor("#737373")
    .text(input.url, { align: "left" })

  // Score band
  doc.moveDown(1.2)
  const bandY = doc.y
  doc.roundedRect(M.left, bandY, CW, 110, 8).fillColor("#FAFAFA").fill()
  // Stripe — uses the operator's primary color so the band feels branded
  doc.rect(M.left, bandY, 6, 110).fillColor(brand.primaryColor).fill()

  applyInter(doc)
  doc
    .fontSize(10)
    .fillColor("#737373")
    .text("OVERALL HEALTH", M.left + 24, bandY + 18, {
      characterSpacing: 1,
    })

  doc
    .fontSize(48)
    .fillColor(scoreColor(input.score))
    .text(`${input.score}`, M.left + 24, bandY + 34, { continued: true })
  doc
    .fontSize(20)
    .fillColor("#737373")
    .text(`/100`, { continued: false })

  doc
    .fontSize(13)
    .fillColor(scoreColor(input.score))
    .text(severityLabel(input.score), M.left + 24, bandY + 88)

  if (input.recipientName) {
    applyPlayfair(doc)
    doc
      .fontSize(12)
      .fillColor("#374151")
      .text(`Prepared for ${input.recipientName}`, M.left + 220, bandY + 30, {
        width: CW - 240,
        align: "right",
      })
  }

  doc.y = bandY + 130

  // ────── CATEGORY GRID ──────
  if (input.scores) {
    applyPlayfair(doc)
    doc.fontSize(18).fillColor("#1A1A1A").text("Category breakdown")
    doc.moveDown(0.4)

    const cats: Array<[string, number | undefined]> = [
      ["SEO", input.scores.seo],
      ["AEO", input.scores.aeo],
      ["Performance", input.scores.performance],
      ["Conversion", input.scores.conversion],
      ["Mobile", input.scores.mobile],
    ]

    const colW = (CW - 8) / 2
    const rowH = 56
    let cx = M.left
    let cy = doc.y

    cats
      .filter((c): c is [string, number] => typeof c[1] === "number")
      .forEach(([name, val], idx) => {
        const x = idx % 2 === 0 ? M.left : M.left + colW + 8
        const y = cy + Math.floor(idx / 2) * (rowH + 8)
        doc.roundedRect(x, y, colW, rowH, 6).fillColor("#FFFFFF").fill()
        doc.lineWidth(1).strokeColor("#E3E3E3").roundedRect(x, y, colW, rowH, 6).stroke()
        applyInter(doc)
        doc
          .fontSize(10)
          .fillColor("#737373")
          .text(name.toUpperCase(), x + 14, y + 12, { characterSpacing: 1 })
        doc
          .fontSize(22)
          .fillColor(scoreColor(val))
          .text(`${val}`, x + 14, y + 24, { continued: true })
        doc
          .fontSize(11)
          .fillColor("#737373")
          .text(`/100`, { continued: false })
        cx = x
      })

    const rows = Math.ceil(
      cats.filter((c): c is [string, number] => typeof c[1] === "number").length / 2,
    )
    doc.y = cy + rows * (rowH + 8) + 8
  }

  // ────── RECOMMENDATIONS ──────
  if (input.recommendations && input.recommendations.length > 0) {
    if (doc.y + 200 > doc.page.height - M.bottom) doc.addPage()
    applyPlayfair(doc)
    doc.fontSize(18).fillColor("#1A1A1A").text("Top priorities")
    doc.moveDown(0.4)

    input.recommendations.slice(0, 5).forEach((rec, i) => {
      if (doc.y + 80 > doc.page.height - M.bottom) doc.addPage()
      const y = doc.y
      doc.roundedRect(M.left, y, CW, 70, 6).fillColor("#FFFFFF").fill()
      doc
        .lineWidth(1)
        .strokeColor("#E3E3E3")
        .roundedRect(M.left, y, CW, 70, 6)
        .stroke()
      // Index pip in primary color
      doc.circle(M.left + 24, y + 24, 12).fillColor(brand.primaryColor).fill()
      applyInter(doc)
      doc
        .fontSize(11)
        .fillColor("#FFFFFF")
        .text(`${i + 1}`, M.left + 19, y + 18, { width: 12, align: "center" })
      applyPlayfair(doc)
      doc
        .fontSize(13)
        .fillColor("#1A1A1A")
        .text(rec.title, M.left + 48, y + 12, { width: CW - 60 })
      applyInter(doc)
      doc
        .fontSize(10.5)
        .fillColor("#374151")
        .text(rec.description, M.left + 48, doc.y + 2, {
          width: CW - 60,
          height: 36,
          ellipsis: true,
        })
      doc.y = y + 80
    })
  }

  // ────── FOOTER on every page ──────
  drawFooters(doc, brand)

  doc.end()
  return done
}

function drawHeader(doc: PDFKit.PDFDocument, brand: BrandTokens) {
  // Brand stripe at the very top — operator color
  doc.rect(0, 0, PW, 6).fillColor(brand.primaryColor).fill()

  applyInter(doc)
  doc
    .fontSize(11)
    .fillColor("#737373")
    .text(brand.businessName, M.left, 22, {
      characterSpacing: 0.5,
      lineBreak: false,
    })
  if (brand.tagline) {
    doc
      .fontSize(9)
      .fillColor("#9CA3AF")
      .text(brand.tagline, M.left, 38, { width: CW * 0.6, lineBreak: false })
  }
  doc.moveTo(M.left, 60).lineTo(PW - M.right, 60).strokeColor("#E3E3E3").lineWidth(1).stroke()
  doc.y = 75
}

function drawFooters(doc: PDFKit.PDFDocument, brand: BrandTokens) {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    const oldBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    // Footer rule
    doc
      .moveTo(M.left, doc.page.height - 42)
      .lineTo(PW - M.right, doc.page.height - 42)
      .strokeColor("#E3E3E3")
      .lineWidth(1)
      .stroke()

    applyInter(doc)
    doc
      .fontSize(9)
      .fillColor("#737373")
      .text(brand.businessName, M.left, doc.page.height - 32, { lineBreak: false })

    if (brand.contactEmail || brand.websiteUrl) {
      const right = [brand.contactEmail, brand.websiteUrl?.replace(/^https?:\/\//, "")]
        .filter(Boolean)
        .join("  ·  ")
      doc.text(right, M.left, doc.page.height - 32, {
        width: CW,
        align: "right",
        lineBreak: false,
      })
    }

    doc.page.margins.bottom = oldBottom
  }
}
