import PDFDocument from "pdfkit"
import path from "path"
import fs from "fs"

// ─── Colors (matching homepage white/crimson theme) ──────────────────────────

const C = {
  crimson: "#981B1B",
  crimsonLight: "#C42424",
  black: "#1A1A1A",
  body: "#374151",
  muted: "#737373",
  border: "#E3E3E3",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  calloutBg: "#FDF2F2",
}

// ─── Font loading ────────────────────────────────────────────────────────────

function loadFonts(doc: PDFKit.PDFDocument) {
  const fontsDir = path.join(process.cwd(), "public", "fonts")

  const interPath = path.join(fontsDir, "Inter-Variable.ttf")
  const playfairPath = path.join(fontsDir, "PlayfairDisplay-Variable.ttf")
  const playfairItalicPath = path.join(fontsDir, "PlayfairDisplay-Italic-Variable.ttf")

  if (fs.existsSync(interPath)) {
    doc.registerFont("Inter", interPath)
  }
  if (fs.existsSync(playfairPath)) {
    doc.registerFont("Playfair", playfairPath)
  }
  if (fs.existsSync(playfairItalicPath)) {
    doc.registerFont("Playfair-Italic", playfairItalicPath)
  }
}

// ─── Layout constants ────────────────────────────────────────────────────────

const M = { top: 50, bottom: 50, left: 56, right: 56 }
const PW = 612 // Letter width
const CW = PW - M.left - M.right // content width

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useInter(doc: PDFKit.PDFDocument) {
  try { doc.font("Inter"); return } catch { /* fallback */ }
  doc.font("Helvetica")
}

function usePlayfair(doc: PDFKit.PDFDocument) {
  try { doc.font("Playfair"); return } catch { /* fallback */ }
  doc.font("Times-Roman")
}

function usePlayfairItalic(doc: PDFKit.PDFDocument) {
  try { doc.font("Playfair-Italic"); return } catch { /* fallback */ }
  doc.font("Times-Roman")
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - M.bottom) {
    doc.addPage()
  }
}

function addPageFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    // Crimson bottom accent line
    doc.moveTo(M.left, doc.page.height - 38).lineTo(PW - M.right, doc.page.height - 38).lineWidth(0.5).strokeColor(C.border).stroke()
    useInter(doc)
    doc.fontSize(7).fillColor(C.muted)
    doc.text("The AI Operator Playbook", M.left, doc.page.height - 30, { lineBreak: false })
    doc.text("aioperatorcollective.com", PW - M.right - 120, doc.page.height - 30, { lineBreak: false, width: 120, align: "right" })
  }
}

function divider(doc: PDFKit.PDFDocument) {
  doc.moveTo(M.left, doc.y + 8).lineTo(PW - M.right, doc.y + 8).lineWidth(0.5).strokeColor(C.border).stroke()
  doc.y += 20
}

function stepBadge(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 24)
  useInter(doc)
  doc.fontSize(8).fillColor(C.crimson).text(text.toUpperCase(), M.left, doc.y, { characterSpacing: 2.5 })
  doc.moveDown(0.3)
}

function heading1(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 40)
  usePlayfair(doc)
  doc.fontSize(26).fillColor(C.black).text(text, M.left, doc.y, { width: CW })
  doc.moveDown(0.5)
}

function heading2(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 30)
  usePlayfair(doc)
  doc.fontSize(16).fillColor(C.black).text(text, M.left, doc.y, { width: CW })
  doc.moveDown(0.4)
}

function heading3(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 22)
  useInter(doc)
  doc.fontSize(11).fillColor(C.crimson).text(text, M.left, doc.y, { width: CW })
  doc.moveDown(0.2)
}

function para(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 20)
  useInter(doc)
  doc.fontSize(10).fillColor(C.body).text(text, M.left, doc.y, { width: CW, lineGap: 4 })
  doc.moveDown(0.4)
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 16)
  useInter(doc)
  doc.fontSize(10).fillColor(C.crimson).text("•  ", M.left + 4, doc.y, { continued: true })
  doc.fillColor(C.body).text(text, { lineGap: 3 })
  doc.moveDown(0.15)
}

function card(doc: PDFKit.PDFDocument, title: string, body: string) {
  ensureSpace(doc, 60)
  const y = doc.y + 4

  useInter(doc)
  const titleH = doc.fontSize(10).heightOfString(title, { width: CW - 32 })
  const bodyH = doc.fontSize(9).heightOfString(body, { width: CW - 32, lineGap: 3 })
  const cardH = titleH + bodyH + 28

  doc.roundedRect(M.left, y, CW, cardH, 4).fill(C.bg)
  doc.rect(M.left, y, 3, cardH).fill(C.crimson)

  doc.fontSize(10).fillColor(C.black).text(title, M.left + 16, y + 10, { width: CW - 32 })
  doc.fontSize(9).fillColor(C.body).text(body, M.left + 16, doc.y + 3, { width: CW - 32, lineGap: 3 })

  doc.y = y + cardH + 8
}

function callout(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 50)
  const y = doc.y + 6

  useInter(doc)
  const textH = doc.fontSize(10).heightOfString(text, { width: CW - 32, lineGap: 4 })
  const boxH = textH + 24

  doc.roundedRect(M.left, y, CW, boxH, 4).fill(C.calloutBg)
  doc.rect(M.left, y, 3, boxH).fill(C.crimson)

  doc.fontSize(10).fillColor(C.black).text(text, M.left + 16, y + 12, { width: CW - 32, lineGap: 4 })

  doc.y = y + boxH + 12
}

function ctaBox(doc: PDFKit.PDFDocument, title: string, body: string, buttonText: string) {
  ensureSpace(doc, 120)
  const y = doc.y + 10

  doc.roundedRect(M.left, y, CW, 110, 6).fill(C.calloutBg)
  doc.roundedRect(M.left, y, CW, 110, 6).lineWidth(1).strokeColor(C.crimson).strokeOpacity(0.2).stroke()

  usePlayfair(doc)
  doc.fontSize(16).fillColor(C.black).text(title, M.left + 24, y + 16, { width: CW - 48, align: "center" })

  useInter(doc)
  doc.fontSize(9).fillColor(C.muted).text(body, M.left + 24, doc.y + 6, { width: CW - 48, align: "center", lineGap: 3 })

  const btnW = 180
  const btnX = M.left + (CW - btnW) / 2
  const btnY = doc.y + 10
  doc.roundedRect(btnX, btnY, btnW, 30, 4).fill(C.crimson)
  doc.fontSize(8).fillColor(C.white).text(buttonText.toUpperCase(), btnX, btnY + 10, { width: btnW, align: "center", characterSpacing: 1.5 })

  doc.y = y + 120
}

function tableRow(doc: PDFKit.PDFDocument, cols: string[], widths: number[], isHeader: boolean, rowHeight = 22) {
  ensureSpace(doc, rowHeight + 4)
  const y = doc.y

  if (isHeader) {
    doc.roundedRect(M.left, y, CW, rowHeight, 2).fill(C.crimson)
    useInter(doc)
    doc.fontSize(7.5).fillColor(C.white)
  } else {
    doc.rect(M.left, y, CW, rowHeight).fill(C.white)
    doc.moveTo(M.left, y + rowHeight).lineTo(PW - M.right, y + rowHeight).lineWidth(0.3).strokeColor(C.border).stroke()
    useInter(doc)
    doc.fontSize(8.5).fillColor(C.body)
  }

  let colX = M.left + 8
  cols.forEach((col, i) => {
    if (isHeader) {
      doc.text(col.toUpperCase(), colX, y + 7, { width: widths[i] - 8, lineBreak: false, characterSpacing: 0.5 })
    } else {
      doc.text(col, colX, y + 6, { width: widths[i] - 8, lineBreak: false })
    }
    colX += widths[i]
  })

  doc.y = y + rowHeight + 1
}

// Table row that allows text wrapping (dynamic height)
function tableRowWrap(doc: PDFKit.PDFDocument, cols: string[], widths: number[]) {
  useInter(doc)
  doc.fontSize(8.5).fillColor(C.body)

  // Measure the tallest cell
  let maxH = 0
  for (let i = 0; i < cols.length; i++) {
    const h = doc.heightOfString(cols[i], { width: widths[i] - 10, lineGap: 2 })
    if (h > maxH) maxH = h
  }
  const rowH = maxH + 12
  ensureSpace(doc, rowH + 4)

  const y = doc.y
  doc.rect(M.left, y, CW, rowH).fill(C.white)
  doc.moveTo(M.left, y + rowH).lineTo(PW - M.right, y + rowH).lineWidth(0.3).strokeColor(C.border).stroke()
  doc.fillColor(C.body)

  let colX = M.left + 8
  cols.forEach((col, i) => {
    doc.text(col, colX, y + 6, { width: widths[i] - 10, lineGap: 2 })
    colX += widths[i]
  })

  doc.y = y + rowH + 1
}

function promptCard(doc: PDFKit.PDFDocument, num: number, title: string, role: string, context: string, command: string, format: string) {
  ensureSpace(doc, 100)
  const y = doc.y + 2

  useInter(doc)
  const lines = [`Role: ${role}`, `Context: ${context}`, `Command: ${command}`, `Format: ${format}`]
  const titleH = doc.fontSize(10).heightOfString(title, { width: CW - 44 })
  let bodyH = 0
  for (const line of lines) {
    bodyH += doc.fontSize(8.5).heightOfString(line, { width: CW - 28 }) + 2
  }
  const cardH = titleH + bodyH + 24

  doc.roundedRect(M.left, y, CW, cardH, 4).lineWidth(0.5).strokeColor(C.border).stroke()

  doc.circle(M.left + 18, y + 14, 8).fill(C.crimson)
  doc.fontSize(8).fillColor(C.white).text(String(num), M.left + 12, y + 10, { width: 12, align: "center" })

  doc.fontSize(10).fillColor(C.black).text(title, M.left + 32, y + 9, { width: CW - 44 })

  let fieldY = doc.y + 4
  useInter(doc)
  for (const line of lines) {
    const [label, ...rest] = line.split(": ")
    doc.fontSize(8.5).fillColor(C.crimson).text(`${label}: `, M.left + 14, fieldY, { continued: true, width: CW - 28 })
    doc.fillColor(C.body).text(rest.join(": "))
    fieldY = doc.y + 1
  }

  doc.y = y + cardH + 6
}

function partCover(doc: PDFKit.PDFDocument, part: string, title: string, kicker: string) {
  doc.addPage()
  // Top crimson bar
  doc.rect(0, 0, PW, 4).fill(C.crimson)

  useInter(doc)
  doc.fontSize(9).fillColor(C.crimson).text(part.toUpperCase(), M.left, 200, { characterSpacing: 3, width: CW })

  usePlayfair(doc)
  doc.fontSize(34).fillColor(C.black).text(title, M.left, 230, { width: CW })

  // Accent bar
  doc.rect(M.left, doc.y + 14, 60, 2).fill(C.crimson)

  useInter(doc)
  doc.fontSize(12).fillColor(C.muted).text(kicker, M.left, doc.y + 28, { width: CW, lineGap: 5 })
}

function tocEntry(doc: PDFKit.PDFDocument, label: string, body: string) {
  ensureSpace(doc, 30)
  const y = doc.y

  // Left accent
  doc.rect(M.left, y + 2, 2, 20).fill(C.crimson)

  useInter(doc)
  doc.fontSize(10).fillColor(C.black).text(label, M.left + 12, y, { width: CW - 14 })
  doc.fontSize(8.5).fillColor(C.muted).text(body, M.left + 12, doc.y + 1, { width: CW - 14, lineGap: 2 })
  doc.moveDown(0.4)
}

// ─── Main Document Builder ───────────────────────────────────────────────────

export function buildAIPlaybookPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: M,
      bufferPages: true,
      info: {
        Title: "The AI Operator Playbook",
        Author: "AI Operator Collective",
        Subject: "How to Launch and Run a Recurring-Revenue AI Advisory Practice",
      },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    loadFonts(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════
    doc.rect(0, 0, PW, 4).fill(C.crimson)

    useInter(doc)
    doc.fontSize(8).fillColor(C.crimson).text("THE OPERATOR PLAYBOOK", 0, 200, { align: "center", characterSpacing: 3 })

    usePlayfair(doc)
    doc.fontSize(44).fillColor(C.black).text("The AI Operator", 0, 226, { align: "center" })
    doc.text("Playbook", { align: "center" })

    const divX = (PW - 50) / 2
    doc.rect(divX, doc.y + 14, 50, 2).fill(C.crimson)

    usePlayfairItalic(doc)
    doc.fontSize(16).fillColor(C.crimson).text(
      "How to Launch and Run a",
      80, doc.y + 30, { align: "center", width: PW - 160 }
    )
    doc.text("Recurring-Revenue AI Advisory Practice", { align: "center", width: PW - 160 })

    useInter(doc)
    doc.fontSize(10).fillColor(C.muted).text(
      "The operator's guide to starting the business, landing the client, and delivering the work.",
      80, doc.y + 20, { align: "center", width: PW - 160, lineGap: 4 }
    )

    doc.fontSize(8).fillColor(C.muted).text("AI Operator Collective", 0, doc.page.height - 80, { align: "center", characterSpacing: 2 })
    doc.fontSize(7).fillColor(C.border).text("aioperatorcollective.com", 0, doc.y + 4, { align: "center" })

    // ═══════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()

    stepBadge(doc, "What's Inside")
    heading1(doc, "Table of Contents")
    para(doc, "This playbook walks you step-by-step through every stage of launching and running an AI advisory practice. Each part has specific actions you can ship this week, and the prompt library at the back gives you 23+ plug-and-play prompts you can run on a client engagement today.")

    doc.moveDown(0.3)

    tocEntry(doc, "Who This Playbook Is For",
      "The exact operator profile this was built for, and what problem it solves.")
    tocEntry(doc, "Part 1: Start the Business",
      "Entity, insurance, banking, contracts, and the pricing math that keeps you profitable from the first engagement.")
    tocEntry(doc, "Part 2: Land the Client",
      "Who to target, how to reach them, how to run the discovery call, and how to close the engagement without undercharging.")
    tocEntry(doc, "Part 3: Deliver the Engagement",
      "The four-part client audit, scoping the first workflow, and running the build-measure loop that produces a case study.")
    tocEntry(doc, "Part 4: Run the Retainer",
      "How to convert a one-time project into a monthly recurring engagement and scale to a book of 5 to 10 clients.")
    tocEntry(doc, "The Operator Prompt Library",
      "The Client Master Prompt, the RCCF format, and 23+ department-by-department prompts you run on behalf of clients.")

    doc.moveDown(0.6)
    callout(doc, "Do the reps. The business gets built by shipping, not by planning. Start the entity this weekend, send 25 warm-network messages next week, and run three discovery calls the week after.")

    // ═══════════════════════════════════════════════════════════════════════
    // WHO THIS PLAYBOOK IS FOR / WHAT YOU GET
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()

    stepBadge(doc, "Introduction")
    heading1(doc, "Who This Playbook Is For")
    para(doc, "You are not trying to deploy AI inside your own company. You are building a business that deploys AI inside other people's companies. Specifically the SMBs and local operators in your market who do not have the time, the team, or the translator to figure this out on their own.")
    para(doc, "That is a real job. The local business owner running a landscaping company, a dental practice, a manufacturing shop, or a regional services firm is sitting on five to ten workflows that AI could cut in half. They will not build it themselves. They will hire someone. That someone is you.")
    para(doc, "This playbook is the operator's path: start the business, land the first client, deliver the engagement, and keep them on retainer. The AI work is the easy part. The business around the AI work is what separates operators who build a real practice from operators who build a folder full of automations.")

    heading2(doc, "What You Get")
    bullet(doc, "Part 1: Start the Business. Entity formation, insurance, banking, contracts, and the pricing math that keeps you profitable from the first engagement.")
    bullet(doc, "Part 2: Land the Client. Who to target, how to reach them, how to run the discovery call, and how to close the engagement without undercharging.")
    bullet(doc, "Part 3: Deliver the Engagement. The four-step client audit, scoping the first workflow, and running the build-measure loop that produces a case study.")
    bullet(doc, "Part 4: Run the Retainer. How to convert a one-time project into a monthly recurring engagement and scale to a book of 5 to 10 clients.")
    bullet(doc, "The Operator Prompt Library. The Master Prompt Template, the RCCF format, and 23+ prompts you can run on a client engagement today, organized by the departments you are most likely to be hired to improve.")

    // ═══════════════════════════════════════════════════════════════════════
    // PART 1: START THE BUSINESS
    // ═══════════════════════════════════════════════════════════════════════
    partCover(doc, "Part 1", "Start the Business",
      "Most new operators skip this part because it is not the exciting part. Then they close their first deal and realize they do not have an entity to invoice from, a contract to send, or a price that covers their taxes. Do the boring work first. It takes a weekend.")

    doc.addPage()
    stepBadge(doc, "Step 1")
    heading2(doc, "Form the Entity")
    para(doc, "An LLC is the default structure. It is cheap, fast, and separates you personally from the business. You want that separation the first time a client asks you to access their CRM or touch their customer data.")
    bullet(doc, "File the LLC in your state. Most states are $50 to $300 and take under a week online.")
    bullet(doc, "Get an EIN from the IRS. Free. Takes 15 minutes online. This is the business's tax ID.")
    bullet(doc, "Open a business bank account under the LLC name. Never commingle personal and business funds, it invalidates the liability protection.")
    bullet(doc, "Get business insurance. General liability plus professional liability (errors and omissions). $40 to $80 per month typical. Some clients will require proof of insurance before they sign.")

    heading2(doc, "Step 2. Name the Practice")
    para(doc, "Your business name should be short, easy to say on a phone call, and clearly a business (not a personal brand). Examples that work: North Street AI, Cascade Advisory, Midmarket AI Partners. Examples that do not: your full name followed by \"Consulting.\"")
    bullet(doc, "Check domain availability before you fall in love with a name. The .com matters.")
    bullet(doc, "Search the state business registry and the USPTO trademark database for obvious conflicts.")
    bullet(doc, "Buy the domain and set up business email (Google Workspace, $6 per user per month). No prospect takes you@gmail.com seriously for a $3K per month retainer.")

    heading2(doc, "Step 3. Price the Work")
    para(doc, "Underpricing is the single most common mistake new operators make. You are not a $50 per hour freelancer. You are an AI advisor delivering measurable P&L impact. Price accordingly.")
    para(doc, "The retainer model is the core economic model. One-time project work is out of scope. Retainers compound. Projects end. The client's AI transformation is an evolution, not an event, and your pricing should reflect that.")

    doc.moveDown(0.3)
    heading3(doc, "Baseline Pricing Anchors")
    const pricingWidths = [CW * 0.26, CW * 0.28, CW * 0.46]
    tableRow(doc, ["Engagement Type", "Typical Range", "When to Use It"], pricingWidths, true)
    tableRowWrap(doc, ["Discovery / Audit", "$2,500 to $5,000 (one-time)", "Paid audit that defines scope for the retainer"], pricingWidths)
    tableRowWrap(doc, ["Starter Retainer", "$2,000 to $2,500 per month", "Single-workflow deployment, monthly optimization"], pricingWidths)
    tableRowWrap(doc, ["Core Retainer", "$2,500 to $4,000 per month", "Multi-workflow deployment across 2 to 3 departments"], pricingWidths)
    tableRowWrap(doc, ["Advanced Retainer", "$4,000 to $7,500 per month", "Full-function transformation, custom agents, reporting"], pricingWidths)

    doc.moveDown(0.3)
    callout(doc, "The math that matters: 5 clients at $2,500 per month is $150,000 per year. 7 clients at $3,000 per month is $252,000 per year. A full book of 10 clients at $2,500 per month is $300,000 per year of recurring revenue from one operator. This is the business.")

    heading2(doc, "Step 4. Build the Contract Kit")
    para(doc, "You need three documents before you take your first call. Do not improvise these on the fly.")
    bullet(doc, "Master Services Agreement (MSA). The umbrella legal terms: liability, IP ownership, confidentiality, termination. Signed once.")
    bullet(doc, "Statement of Work (SOW). Per-engagement scope, deliverables, timeline, and fees. Referenced under the MSA.")
    bullet(doc, "Mutual NDA. Signed before the discovery call if the prospect asks for it, or before any shared document exchange.")
    para(doc, "Use a lawyer once to set these up, or start from vetted templates and have a lawyer review. The one-time cost is a couple hundred dollars. The cost of not having them is a client dispute you cannot win.")

    // ═══════════════════════════════════════════════════════════════════════
    // PART 2: LAND THE CLIENT
    // ═══════════════════════════════════════════════════════════════════════
    partCover(doc, "Part 2", "Land the Client",
      "AI expertise without clients is a hobby. The fastest path from zero to first retainer is not a cold email blast. It is a targeted, personal approach to businesses you already have some connection to: your warm network, your former industry, and the local operators in your market.")

    doc.addPage()
    stepBadge(doc, "Step 1")
    heading2(doc, "Define Your Ideal Client")
    para(doc, "Do not try to serve every business. Pick a lane. The tighter your target, the sharper your message, and the easier the sale.")
    heading3(doc, "Strong first-client profiles share four traits")
    bullet(doc, "$1M to $25M in annual revenue. Big enough to pay a real retainer, small enough that the owner makes decisions and you are not selling to a committee.")
    bullet(doc, "Established business, not a startup. Real operations, real processes, real waste. Startups do not have the repetition AI needs to create leverage.")
    bullet(doc, "Owner-operator or small leadership team. One or two decision makers. No procurement department. You can go from first call to signed contract in 2 to 3 weeks.")
    bullet(doc, "A specific, visible pain. Leads falling through cracks. Hours spent on quotes or scheduling. A customer support inbox that never empties. Pain you can solve in 30 days is worth ten times more than generic \"AI interest.\"")
    para(doc, "Industry focus accelerates the sale. Home services. Healthcare practices. Manufacturing. Professional services. Real estate. Pick one. Land two or three clients in that vertical, and the case studies build the pipeline for you.")

    heading2(doc, "Step 2. Build the Pipeline")
    para(doc, "Your first 10 to 15 prospects should come from three sources, in this order.")

    heading3(doc, "Source 1: Your Warm Network")
    para(doc, "Former coworkers, former bosses, people who know your work. Send 25 personal messages in the first week. Not a pitch, a conversation.")
    callout(doc, "Opener: \"Hey, wanted to let you know I've started an AI advisory practice helping SMBs deploy AI across their operations. Not pitching you, but if you know any local business owners who are curious about this, I'd love an introduction. And if you're curious yourself, happy to share what I'm seeing.\"")
    para(doc, "Expect 20 to 30 percent to respond. Of those, 3 to 5 will either become your first prospect or introduce you to one.")

    heading3(doc, "Source 2: Your Local Market")
    para(doc, "Drive through your town. Look at the businesses with trucks in the parking lot, signage on the building, and more than 10 employees. That is your list. Local businesses trust local providers.")
    bullet(doc, "Chamber of Commerce events and industry meetups are the single highest-leverage use of your time in month one. Go in person. Be the only AI person in the room.")
    bullet(doc, "BNI and referral groups are built for this exact business. One seat per category. The AI advisor seat is almost always open.")
    bullet(doc, "LinkedIn local search filtered by your metro and company size 10 to 200 employees. Connect, then send a personal message, not a pitch.")

    heading3(doc, "Source 3: Targeted Outbound")
    para(doc, "Once you have a defined ICP, cold outreach works, but only if it is specific.")
    bullet(doc, "Build a list of 100 businesses that match your ICP in one vertical and one geography.")
    bullet(doc, "Send a short, personalized email that names their company, identifies one specific workflow you can improve, and offers a 20-minute conversation. No generic \"AI transformation\" language.")
    bullet(doc, "Follow up three times over two weeks. Most replies come from the third touch.")

    doc.addPage()
    stepBadge(doc, "Step 3")
    heading2(doc, "Run the Discovery Call")
    para(doc, "The discovery call is a diagnostic, not a pitch. Your job is to identify a real, expensive problem and earn the right to propose a solution.")

    heading3(doc, "The 30-Minute Structure")
    card(doc, "Minutes 0 to 5: Rapport and agenda",
      "\"Here is how I run these. I want to understand your business, the parts that are working, and the parts that are not. If I see something I can help with, I'll tell you. If I don't, I'll tell you that too.\"")
    card(doc, "Minutes 5 to 20: Diagnostic questions",
      "Ask about their operations, their team, their tools, and their bottlenecks. Listen for the words \"we spend too much time on...\" and \"we keep losing...\" those are your opportunities.")
    card(doc, "Minutes 20 to 27: Mirror back the opportunity",
      "\"Based on what you told me, here is what I'd focus on first. This is the workflow that is costing you the most time and has the fastest payback.\"")
    card(doc, "Minutes 27 to 30: Next step",
      "Propose a paid audit or a scoped engagement. Never leave the call without a defined next step and a date on the calendar.")

    heading3(doc, "The Questions That Matter")
    bullet(doc, "Walk me through a typical week. Where does your team's time actually go?")
    bullet(doc, "What is the one workflow that, if you could wave a wand and fix it, would change the business the most?")
    bullet(doc, "What have you already tried? What worked and what didn't?")
    bullet(doc, "If we solved this, what would it be worth to you in hours saved, in revenue gained, or in stress removed?")
    bullet(doc, "Who else is involved in a decision like this? What would it take to move forward?")

    heading2(doc, "Step 4. Propose and Close")
    para(doc, "Send the proposal within 48 hours of the discovery call. Speed signals seriousness. A week-long delay kills deals.")
    heading3(doc, "The One-Page Proposal")
    bullet(doc, "The problem, in their words. Quote their language back to them. This proves you listened.")
    bullet(doc, "The proposed scope. One workflow for the starter engagement. Resist the urge to boil the ocean.")
    bullet(doc, "The expected outcome, quantified. Hours reclaimed, response time reduced, revenue recovered. Give them a number they can believe.")
    bullet(doc, "The investment. Audit fee (if separate) and the monthly retainer. Two options, standard and premium, makes the \"yes\" easier than a single take-it-or-leave-it price.")
    bullet(doc, "The timeline. Week-by-week plan for the first 30 to 60 days.")
    bullet(doc, "The next step. \"Sign here and we start Monday.\" Never end a proposal without a specific next action.")

    callout(doc, "Handling the most common objection. \"Let me think about it\" is not an objection, it's a stall. Your response: \"Totally fair. What specifically do you want to think about? Let me help you think through it now.\" Nine out of ten times the real objection comes out in the next 30 seconds.")

    // ═══════════════════════════════════════════════════════════════════════
    // PART 3: DELIVER THE ENGAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    partCover(doc, "Part 3", "Deliver the Engagement",
      "Clients hire you because they believe you will produce a result. Your delivery process is how you prove it. This is where the case study gets built, and the case study is what generates your next three clients.")

    doc.addPage()
    stepBadge(doc, "Step 1")
    heading2(doc, "Run the Client Audit")
    para(doc, "Every engagement starts with a structured audit of the client's business. The goal is to identify 3 to 5 high-leverage workflows where AI will immediately reclaim time or reduce error. Do not start building until the audit is complete.")

    heading3(doc, "The Four-Part Sweep")
    card(doc, "1. Map the workflows",
      "Sit with the owner and a key team member. List every recurring task across sales, operations, customer service, marketing, and finance. Write them down, no matter how small.")
    card(doc, "2. Rank them by cost",
      "For each workflow, estimate the hours it consumes per week and the fully loaded labor cost. The expensive ones rise to the top.")
    card(doc, "3. Filter for AI leverage",
      "A workflow is a strong AI candidate if it is repetitive, rules-based, or relies on existing data the business already has. A workflow is a weak candidate if it requires physical presence, high-judgment reasoning, or heavy relationship context.")
    card(doc, "4. Pick the first target",
      "Choose the highest-ROI, lowest-risk workflow. Not the most interesting one, the one most likely to produce a visible win in 30 days. You are buying trust with the first deployment.")

    heading3(doc, "Where Operators Typically Find Quick Wins")
    para(doc, "Use this as a menu during the audit, not a checklist to sell.")
    const deptW = [CW * 0.24, CW * 0.76]
    tableRow(doc, ["Department", "High-Leverage AI Workflows to Look For"], deptW, true)
    tableRowWrap(doc, ["Sales", "Lead qualification and routing. Call summary into CRM. Predictive scoring on pipeline. Personalized follow-up sequences."], deptW)
    tableRowWrap(doc, ["Customer Service", "Ticket triage and routing. Drafted responses for common inquiries. After-hours chat coverage. Onboarding automation."], deptW)
    tableRowWrap(doc, ["Operations", "Scheduling and dispatch. Quote generation. Inventory and demand forecasting. Internal knowledge-base assistant."], deptW)
    tableRowWrap(doc, ["Marketing", "Content production and repurposing. Ad creative variants. Email sequence drafting. Social scheduling."], deptW)
    tableRowWrap(doc, ["Finance / Admin", "Invoice capture and categorization. Receipt chasing. Anomaly detection. Cash flow forecasting."], deptW)
    tableRowWrap(doc, ["HR / Hiring", "Resume screening. Interview scheduling. Onboarding content generation. Policy Q&A assistant."], deptW)

    doc.moveDown(0.3)
    callout(doc, "Deliverable: An AI Opportunity Map document handed to the client at the end of the audit. It lists every workflow reviewed, the top 3 to 5 opportunities with estimated ROI, and the recommended first deployment. This document justifies the retainer and becomes the roadmap for months 2 through 6.")

    doc.addPage()
    stepBadge(doc, "Step 2")
    heading2(doc, "Design the Workflow")
    para(doc, "Every AI workflow you build follows the same four-stage pattern. If you cannot describe a proposed build in this structure, the build is not ready.")
    card(doc, "1. Trigger", "The event that kicks it off: a form submission, a new inbound lead, an incoming email, a completed job.")
    card(doc, "2. AI Processing", "The model step: classify, draft, summarize, extract, or score.")
    card(doc, "3. Automation", "The system step: push data into the CRM, post to Slack, create a task, send an email, update a dashboard.")
    card(doc, "4. Human-in-the-Loop", "The review step: the client's team approves, edits, or acts on the AI output. AI handles 80 to 90 percent of the volume; humans handle the exceptions and the judgment calls.")
    para(doc, "Tool selection is downstream of workflow design. Pick the minimum viable stack. A typical starter build uses a CRM the client already owns, one automation platform (Zapier, Make, or n8n), and one AI layer (Claude or OpenAI via API or a purpose-built product). Resist adding tools the client does not need.")

    heading2(doc, "Step 3. Capture the Baseline")
    para(doc, "Before you touch anything, write down the numbers. You cannot prove a result you did not measure from the start.")
    bullet(doc, "Hours spent on the workflow per week, by role.")
    bullet(doc, "Fully loaded labor cost of those hours.")
    bullet(doc, "Volume processed per week (leads qualified, tickets resolved, invoices processed).")
    bullet(doc, "Quality metric where it matters: response time, error rate, conversion rate, customer satisfaction.")
    callout(doc, "Get these numbers signed off by the client before the build begins. Baselines captured after the fact are always contested.")

    heading2(doc, "Step 4. Build, Measure, Improve")
    para(doc, "Do not over-engineer. Ship the smallest version of the workflow that can produce a result. Then measure, refine, and expand.")

    heading3(doc, "The Weekly Cadence")
    bullet(doc, "Monday: Review prior week's outputs with the client. Flag any corrections.")
    bullet(doc, "Tuesday to Thursday: Ship prompt improvements, logic refinements, edge-case handling.")
    bullet(doc, "Friday: Update the metrics log. Hours saved, volume processed, quality score. Share with the client.")

    heading3(doc, "The Metrics You Report Monthly")
    const metricsW = [CW * 0.28, CW * 0.72]
    tableRow(doc, ["Metric", "What It Proves"], metricsW, true)
    tableRowWrap(doc, ["Hours Saved", "Labor reclaimed per week. The fastest-to-justify number."], metricsW)
    tableRowWrap(doc, ["Cost Impact", "Labor cost reclaimed vs. cost of the retainer plus tooling. This is the ROI number."], metricsW)
    tableRowWrap(doc, ["Volume / Throughput", "Leads processed, tickets resolved, quotes sent, before and after."], metricsW)
    tableRowWrap(doc, ["Quality / Consistency", "Percentage of AI outputs accepted without edits. Response time reduction."], metricsW)
    tableRowWrap(doc, ["Revenue Lift", "Where attributable: recovered leads, faster close times, expanded capacity."], metricsW)

    doc.moveDown(0.3)
    callout(doc, "If your first 30-day report shows 15+ hours per week reclaimed and the retainer is cheaper than the reclaimed labor, the second month of retainer is a near-automatic yes. That is the math that drives retention.")

    heading2(doc, "Step 5. Capture the Case Study")
    para(doc, "The case study is a contract deliverable, not an afterthought. Bake it into the SOW so the client agrees to participate at the point of sale. Even a single strong case study changes your pipeline permanently.")
    bullet(doc, "Baseline metrics captured at audit.")
    bullet(doc, "Outcome metrics at 30, 60, and 90 days.")
    bullet(doc, "One quote from the client describing the impact in their own words.")
    bullet(doc, "A written narrative: one page, the problem, the solution, the numbers.")
    bullet(doc, "First right of refusal on a branded version with their name attached; an anonymized version as the fallback.")

    // ═══════════════════════════════════════════════════════════════════════
    // PART 4: RUN THE RETAINER
    // ═══════════════════════════════════════════════════════════════════════
    partCover(doc, "Part 4", "Run the Retainer",
      "The first engagement opens the door. The retainer is the business. Operators who do not convert projects to retainers churn their client base every 90 days and start over. Operators who run retainers build a book of business that compounds.")

    doc.addPage()
    stepBadge(doc, "Step 1")
    heading2(doc, "Convert the Audit Into a Retainer")
    para(doc, "Structure the first engagement as a paid audit that flows directly into a monthly retainer. Do not run free discovery work. A prospect who will not pay for an audit will not pay for a retainer.")
    bullet(doc, "Audit fee of $2,500 to $5,000 paid upfront, scoped to 2 to 3 weeks.")
    bullet(doc, "Retainer engagement at $2,000 to $4,000 per month, scoped to the recommended workflow and ongoing optimization.")
    bullet(doc, "Audit fee credited against the first month of the retainer if the client signs within 14 days. Creates urgency without discounting the audit's value.")

    heading2(doc, "Step 2. Define What the Retainer Actually Includes")
    para(doc, "Vague retainers get cancelled. Specific retainers get renewed. The client should see exactly what they are paying for each month.")
    bullet(doc, "One deployed workflow at a time, actively maintained and optimized.")
    bullet(doc, "One optimization cycle per month: prompt refinement, new edge case handling, performance review.")
    bullet(doc, "One new workflow every 60 to 90 days on the advanced tier. This is the expansion path.")
    bullet(doc, "A monthly written report with metrics, observations, and next-month priorities.")
    bullet(doc, "One 45-minute review call per month with the owner. This is the relationship.")
    bullet(doc, "Slack or email support during business hours. Response times defined in the SOW.")

    heading2(doc, "Step 3. Expand Inside the Account")
    para(doc, "The cheapest new client is the existing one. Every retainer client should have an expansion path mapped from month one.")
    card(doc, "Month 1 to 2", "Ship the first workflow. Prove the ROI. Establish trust.")
    card(doc, "Month 3", "Identify the second-highest opportunity from the original audit. Scope it.")
    card(doc, "Month 4 to 5", "Ship the second workflow. Update the retainer tier if scope expands.")
    card(doc, "Month 6", "Run a 6-month review. Present cumulative hours saved, revenue impact, and the 6-month roadmap.")
    card(doc, "Month 7+", "Continue the build-measure loop. Add workflows every 60 to 90 days.")

    callout(doc, "Expansion math: A client that starts at $2,000 per month and expands to $4,000 per month by month six nets you an additional $24,000 per year from the same relationship. Do this with three clients and you have added $72,000 per year without a single new sale.")

    heading2(doc, "Step 4. Build the Book")
    para(doc, "A full operator practice is 5 to 10 clients on retainer, not 50. Focus on retention and expansion before you focus on acquisition volume.")
    const bookW = [CW * 0.15, CW * 0.25, CW * 0.3, CW * 0.3]
    tableRow(doc, ["Clients", "Avg Retainer", "Monthly Revenue", "Annual Revenue"], bookW, true)
    tableRowWrap(doc, ["3", "$2,000", "$6,000", "$72,000"], bookW)
    tableRowWrap(doc, ["5", "$2,000", "$10,000", "$120,000"], bookW)
    tableRowWrap(doc, ["7", "$2,500", "$17,500", "$210,000"], bookW)
    tableRowWrap(doc, ["10", "$2,500", "$25,000", "$300,000"], bookW)

    doc.moveDown(0.3)
    para(doc, "Ten clients is a full practice for a solo operator. If you want to grow past ten, you hire a junior operator or a delivery associate, not more direct relationships. The operator model scales through leverage, not through volume.")

    // ═══════════════════════════════════════════════════════════════════════
    // THE OPERATOR PROMPT LIBRARY
    // ═══════════════════════════════════════════════════════════════════════
    partCover(doc, "Prompt Library", "The Operator Prompt Library",
      "These prompts are the core of how you deliver client work every day. Two things to know before you use them.")

    doc.addPage()
    stepBadge(doc, "Before You Run Prompts")
    heading2(doc, "1. Use the Client Master Prompt")
    para(doc, "Every client gets their own Master Prompt. You build it during the audit by interviewing the owner, and you paste it once per chat so the AI shows up correctly for that specific business: their voice, their audience, their priorities. This is the single highest-leverage prompt engineering skill you have.")

    heading3(doc, "Client Master Prompt Template")
    const mptText = `"Here is how to show up for this business every time:

The business is [COMPANY NAME], a [BUSINESS TYPE] serving [AUDIENCE] in [GEOGRAPHY]. The owner is [NAME], who runs it like [OPERATING STYLE]. Primary offers are [OFFERS]. Core customer is [CUSTOMER DESCRIPTION].

Voice and style: [DESCRIBE, e.g., direct, warm, knowledgeable, no jargon]. [READING LEVEL]. [AMERICAN/BRITISH ENGLISH].

Business priorities: [GROW REVENUE / CUT COSTS / RECLAIM OWNER TIME / IMPROVE RETENTION]. Values [SPEED / QUALITY / RELATIONSHIPS / CRAFT].

When you write or decide: give concrete options, cite specifics from the business, flag assumptions. Push back when the ask is weak. QA check before finishing: Is it specific to this business? Is it useful this week? Is the next step clear?

If information is missing, ask up to 3 short questions. Otherwise, act."`

    useInter(doc)
    const mptH = doc.fontSize(9).heightOfString(mptText, { width: CW - 28, lineGap: 3 })
    const mptY = doc.y + 4
    const mptBoxH = mptH + 30

    doc.roundedRect(M.left, mptY, CW, mptBoxH, 4).fill(C.bg)
    doc.rect(M.left, mptY, 3, mptBoxH).fill(C.crimson)

    doc.fontSize(7).fillColor(C.crimson).text("PASTE ONCE PER CLIENT CHAT", M.left + 14, mptY + 8, { characterSpacing: 1.5 })
    doc.fontSize(9).fillColor(C.body).text(mptText, M.left + 14, doc.y + 6, { width: CW - 28, lineGap: 3 })
    doc.y = mptY + mptBoxH + 12

    heading2(doc, "2. Use the RCCF Format for Every Task")
    para(doc, "Role: who the AI is acting as. Context: the goal, audience, inputs. Command: the action. Format: how the output should be structured.")
    para(doc, "Build every prompt in this structure. Consistent inputs produce consistent outputs.")
    card(doc, "The universal format for any AI task",
      "Role: [ROLE]  |  Context: [GOAL + AUDIENCE + INPUTS]  |  Command: [ACTION]  |  Format: [OUTPUT FORMAT]")

    callout(doc, "The prompts that follow are starting points, not finished products. Always run them under the Client Master Prompt so the output fits the specific business. All of these are prompts you run on behalf of a client, not for yourself.")

    // ═══════════════════════════════════════════════════════════════════════
    // SALES PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Prompts by Department")
    heading2(doc, "Sales")
    promptCard(doc, 1, "Lead Qualification & Routing",
      "Act as the client's head of sales.",
      "Inbound lead data at [SOURCE]. ICP definition [ICP]. Qualification criteria [CRITERIA]. Response SLA [TIME].",
      "Score each lead 1 to 10 against ICP fit and buying intent. Recommend routing: hot to owner, warm to sales, cold to nurture.",
      "Table: Lead, Score, Rationale, Route, Suggested first message.")
    promptCard(doc, 2, "Discovery Call Prep for the Client's Sales Team",
      "Act as a sales coach preparing the client's team for a prospect call.",
      "Prospect [NAME], company [CO], pain [PAIN], prior touches [TOUCHES].",
      "Build a call plan: opener, 5 diagnostic questions, likely objections with responses, a specific next step.",
      "Opener (2 to 3 lines), Questions (numbered), Objections (table), Next step.")
    promptCard(doc, 3, "Call Summary Into CRM",
      "Act as a CRM operations analyst.",
      "Transcript or recording of a sales call at [LINK]. CRM fields to populate [FIELDS].",
      "Extract key decisions, pain points, budget signals, decision timeline. Draft CRM notes and next-action tasks.",
      "Summary (5 lines), CRM fields (key: value), Next actions (owner, due date).")
    promptCard(doc, 4, "Follow-Up Sequence",
      "Act as the client's account executive.",
      "Prospect [NAME], last interaction [SUMMARY], offer [OFFER].",
      "Write a 4-touch follow-up sequence over 14 days. Each touch adds a new angle: proof, urgency, risk reversal, direct ask.",
      "Touch #, Day, Channel, Subject, Body, CTA.")
    promptCard(doc, 5, "Objection Handling Playbook",
      "Act as an objection strategist for the client's sales team.",
      "Common objection [OBJECTION]. Segment [SEGMENT]. Proof points [PROOF].",
      "Produce 3 response tracks: data-driven, story-driven, and future-pace. Each short enough to say out loud in under 90 seconds.",
      "Track, When to use, Script, Proof reference.")

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOMER SERVICE PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Customer Service")
    promptCard(doc, 1, "Support Ticket Triage",
      "Act as a support team lead.",
      "Incoming ticket queue at [SOURCE]. Team skill matrix [MATRIX]. SLA rules [RULES].",
      "Classify each ticket by urgency, category, and complexity. Route to the right team member. Draft an acknowledgement reply.",
      "Ticket ID, Urgency, Category, Assign to, Acknowledgement draft.")
    promptCard(doc, 2, "Response Draft for Common Inquiries",
      "Act as a customer service rep for the client.",
      "Customer inquiry [INQUIRY]. Product/service details [DETAILS]. Tone guide [TONE].",
      "Draft a response that resolves the issue in one reply. Include the answer, the reasoning, and the next step.",
      "Subject, Greeting, Body (3 short paragraphs), Next step, Sign-off.")
    promptCard(doc, 3, "Onboarding Sequence for New Customers",
      "Act as the client's customer success manager.",
      "Product/service [PRODUCT]. Typical first-week value [VALUE]. Common stumbling blocks [BLOCKERS].",
      "Build a 5-touch onboarding sequence designed to get the customer to their first meaningful outcome in week one.",
      "Day, Channel, Message subject, Body, Success signal.")
    promptCard(doc, 4, "Retention Risk Scan",
      "Act as a retention analyst.",
      "Customer usage/behavior data [DATA]. Support ticket history [TICKETS]. Sentiment signals [NOTES].",
      "Identify customers at risk of churn. Recommend a specific save play for each, with an owner and a deadline.",
      "Customer, Risk Level, Signal, Save Play, Owner, Due Date.")
    promptCard(doc, 5, "Review Request & Response Sequence",
      "Act as the client's reputation manager.",
      "Completed customer engagements from [SOURCE]. Target review platforms [PLATFORMS].",
      "Draft a review request sequence. Include response templates for 5-star, neutral, and negative reviews.",
      "Request email, 5-star reply, Neutral reply, Negative reply (de-escalate + invite offline).")

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATIONS PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Operations")
    promptCard(doc, 1, "Scheduling & Dispatch Optimization",
      "Act as a dispatch coordinator for the client.",
      "Pending jobs [JOBS]. Crew capacity [CREWS]. Travel constraints [CONSTRAINTS]. Priority rules [RULES].",
      "Propose an optimized schedule that minimizes travel time and maximizes jobs completed. Flag conflicts.",
      "Schedule table: Crew, Job, Start time, Location, Notes. Conflicts list below.")
    promptCard(doc, 2, "Quote Generation",
      "Act as an estimator for the client.",
      "Customer request [REQUEST]. Pricing matrix [MATRIX]. Past-job reference data [REFERENCE].",
      "Generate a draft quote with line items, pricing, terms, and next steps. Flag any assumptions requiring owner review.",
      "Header, Scope summary, Line items table, Total, Terms, Next step.")
    promptCard(doc, 3, "Internal Knowledge Assistant Prompt",
      "Act as the client's internal operations assistant.",
      "Internal documentation at [SOURCE]. Common team questions [QUESTIONS].",
      "Answer the team member's question using only internal documentation. If the answer is not in the docs, say so and suggest who to ask.",
      "Answer (2 to 3 sentences), Source reference, Follow-up suggestion.")
    promptCard(doc, 4, "Process Documentation",
      "Act as an operations documentation specialist.",
      "Recording or description of how a team member performs [PROCESS]. Audience: new hires.",
      "Turn this into a clear, numbered SOP a new hire could follow without additional instruction.",
      "Title, Purpose, Tools needed, Steps (numbered, imperative), Checks, Common mistakes.")
    promptCard(doc, 5, "Inventory / Demand Forecast",
      "Act as an operations analyst.",
      "Sales data [DATA]. Seasonality patterns [PATTERNS]. Lead times [LEAD TIMES].",
      "Forecast next 30/60/90 days of demand. Recommend reorder points and flag any stockout risks.",
      "Table: SKU, Forecast, Current inventory, Reorder point, Action, Risk flag.")

    // ═══════════════════════════════════════════════════════════════════════
    // MARKETING & CONTENT PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Marketing & Content")
    promptCard(doc, 1, "Monthly Content Calendar",
      "Act as a content strategist for the client.",
      "Business [BUSINESS]. Target customer [CUSTOMER]. Offers [OFFERS]. Channels [CHANNELS].",
      "Build a 30-day content calendar with one theme per week. Each piece tied to a business outcome.",
      "Table: Day, Channel, Topic, Hook, Format, CTA, Business outcome.")
    promptCard(doc, 2, "Short-Form Video Scripts",
      "Act as a short-form video coach for the client.",
      "Topic [TOPIC]. Audience [AUDIENCE]. CTA [CTA].",
      "Write 3 scripts using the Hook-Story-Lesson structure. Each under 45 seconds spoken.",
      "Hook (1 line), Story (3 to 5 lines), Lesson (3 steps), CTA.")
    promptCard(doc, 3, "Email Newsletter",
      "Act as the client's newsletter editor.",
      "List [SIZE/SEGMENT]. This week's topic [TOPIC]. Offer [OFFER].",
      "Write a concise newsletter: personal hook, one lesson or insight, one soft CTA.",
      "Subject line (3 options), Preview text, Body (250 to 400 words), CTA.")
    promptCard(doc, 4, "Ad Creative Variations",
      "Act as a media buyer for the client.",
      "Platform [META/GOOGLE/LINKEDIN]. Audience [AUDIENCE]. Offer [OFFER]. Proof points [PROOF].",
      "Generate 10 ad angles with 3 copy variants and 1 visual concept each. Keep claims grounded in real customer outcomes.",
      "Table: Angle, Copy variants, Visual idea, Proof reference.")
    promptCard(doc, 5, "Customer Language Hook Bank",
      "Act as a voice-of-customer analyst.",
      "Inputs: reviews, call recordings, support tickets at [SOURCES].",
      "Extract 25 hooks using the customer's own words. Tag each to a specific pain or desire.",
      "Table: Hook, Pain/Desire, Source, Suggested use (ad / email / landing page).")

    // ═══════════════════════════════════════════════════════════════════════
    // FINANCE & ADMIN PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Finance & Admin")
    promptCard(doc, 1, "Invoice Capture & Categorization",
      "Act as a bookkeeping assistant for the client.",
      "Incoming invoices [SOURCE]. Chart of accounts [COA]. Vendor history [VENDORS].",
      "Extract vendor, date, amount, category. Flag anomalies (new vendors, unusual amounts, duplicate invoices).",
      "Table: Invoice, Vendor, Date, Amount, Category, Flag, Note.")
    promptCard(doc, 2, "Weekly KPI Scorecard",
      "Act as an operator-analyst for the client.",
      "Data sources [CRM / ADS / BILLING / OPS]. Targets [TARGETS].",
      "Produce a one-page scorecard. Highlight trends, red flags, and recommended actions.",
      "Table: KPI, Current, Prior week, Trend, Target, Note, Recommended action.")
    promptCard(doc, 3, "Cash Flow Forecast",
      "Act as a fractional CFO for the client.",
      "Current cash [CASH]. Receivables [AR]. Payables [AP]. Recurring revenue/expenses [RECURRING].",
      "Project cash position over the next 90 days. Flag any week where cash falls below [THRESHOLD].",
      "Weekly table: Week, Starting cash, Inflows, Outflows, Ending cash, Flag.")

    // ═══════════════════════════════════════════════════════════════════════
    // GET TO WORK / FINAL CTA
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Closing")
    heading1(doc, "Get to Work")
    para(doc, "The operators who win are not the ones with the most tools. They are the ones who pick one client, one workflow, and one month, and ship. The business gets built in the reps.")
    para(doc, "Start the entity this weekend. Send 25 warm-network messages next week. Run three discovery calls the week after. Close the first audit the week after that. The whole loop is 30 days. Do the reps.")

    ctaBox(
      doc,
      "Ready to build your practice alongside other operators?",
      "Inside the AI Operator Collective, you get the full curriculum, live weekly calls with mentors who've done this, and the exact templates and scripts used throughout this playbook.",
      "Apply to the Collective"
    )

    // Finalize with footers on every page
    addPageFooters(doc)
    doc.flushPages()
    doc.end()
  })
}
