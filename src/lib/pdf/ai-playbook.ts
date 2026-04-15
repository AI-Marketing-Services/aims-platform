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

function hasFont(doc: PDFKit.PDFDocument, name: string): boolean {
  try {
    doc.font(name)
    return true
  } catch {
    return false
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
  // Add footers to all pages after doc is built
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    // Crimson bottom accent line
    doc.moveTo(M.left, doc.page.height - 38).lineTo(PW - M.right, doc.page.height - 38).lineWidth(0.5).strokeColor(C.border).stroke()
    useInter(doc)
    doc.fontSize(7).fillColor(C.muted)
    // Use _textOptions-free drawing to avoid pagination
    doc.text("AI Operator Collective", M.left, doc.page.height - 30, { lineBreak: false })
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
  doc.fontSize(10).fillColor(C.crimson).text("—  ", M.left + 4, doc.y, { continued: true })
  doc.fillColor(C.body).text(text, { lineGap: 3 })
  doc.moveDown(0.15)
}

function card(doc: PDFKit.PDFDocument, title: string, body: string) {
  ensureSpace(doc, 60)
  const y = doc.y + 4

  // Measure text height first
  useInter(doc)
  const titleH = doc.fontSize(10).heightOfString(title, { width: CW - 32 })
  const bodyH = doc.fontSize(9).heightOfString(body, { width: CW - 32, lineGap: 3 })
  const cardH = titleH + bodyH + 28

  // Background
  doc.roundedRect(M.left, y, CW, cardH, 4).fill(C.bg)
  // Left accent
  doc.rect(M.left, y, 3, cardH).fill(C.crimson)

  // Title
  doc.fontSize(10).fillColor(C.black).text(title, M.left + 16, y + 10, { width: CW - 32 })
  // Body
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

  // Light crimson background box
  doc.roundedRect(M.left, y, CW, 110, 6).fill(C.calloutBg)
  doc.roundedRect(M.left, y, CW, 110, 6).lineWidth(1).strokeColor(C.crimson).strokeOpacity(0.2).stroke()

  usePlayfair(doc)
  doc.fontSize(16).fillColor(C.black).text(title, M.left + 24, y + 16, { width: CW - 48, align: "center" })

  useInter(doc)
  doc.fontSize(9).fillColor(C.muted).text(body, M.left + 24, doc.y + 6, { width: CW - 48, align: "center", lineGap: 3 })

  // Button
  const btnW = 180
  const btnX = M.left + (CW - btnW) / 2
  const btnY = doc.y + 10
  doc.roundedRect(btnX, btnY, btnW, 30, 4).fill(C.crimson)
  doc.fontSize(8).fillColor(C.white).text(buttonText.toUpperCase(), btnX, btnY + 10, { width: btnW, align: "center", characterSpacing: 1.5 })

  doc.y = y + 120
}

function tableRow(doc: PDFKit.PDFDocument, cols: string[], widths: number[], isHeader: boolean) {
  ensureSpace(doc, 24)
  const y = doc.y
  const rowH = 22

  if (isHeader) {
    doc.roundedRect(M.left, y, CW, rowH, 2).fill(C.crimson)
    useInter(doc)
    doc.fontSize(7.5).fillColor(C.white)
  } else {
    doc.rect(M.left, y, CW, rowH).fill(doc.y % 2 === 0 ? C.bg : C.white)
    doc.moveTo(M.left, y + rowH).lineTo(PW - M.right, y + rowH).lineWidth(0.3).strokeColor(C.border).stroke()
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

  doc.y = y + rowH + 1
}

function promptCard(doc: PDFKit.PDFDocument, num: number, title: string, role: string, context: string, command: string, format: string) {
  ensureSpace(doc, 90)
  const y = doc.y + 2

  // Measure content
  useInter(doc)
  const lines = [`Role: ${role}`, `Context: ${context}`, `Command: ${command}`, `Format: ${format}`]
  const titleH = doc.fontSize(10).heightOfString(`${num}. ${title}`, { width: CW - 28 })
  let bodyH = 0
  for (const line of lines) {
    bodyH += doc.fontSize(8.5).heightOfString(line, { width: CW - 28 }) + 2
  }
  const cardH = titleH + bodyH + 24

  // Background
  doc.roundedRect(M.left, y, CW, cardH, 4).lineWidth(0.5).strokeColor(C.border).stroke()

  // Number badge
  doc.circle(M.left + 18, y + 14, 8).fill(C.crimson)
  doc.fontSize(8).fillColor(C.white).text(String(num), M.left + 12, y + 10, { width: 12, align: "center" })

  // Title
  doc.fontSize(10).fillColor(C.black).text(title, M.left + 32, y + 9, { width: CW - 44 })

  // RCCF fields
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

// ─── Main Document Builder ───────────────────────────────────────────────────

export function buildAIPlaybookPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: M,
      bufferPages: true,
      info: {
        Title: "The AI Operating System - AIMS Playbook",
        Author: "AI Operator Collective",
        Subject: "Deploy AI across every department without hiring or getting technical",
      },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Register fonts
    loadFonts(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════

    // Crimson accent bar at top
    doc.rect(0, 0, PW, 4).fill(C.crimson)

    // Badge
    useInter(doc)
    doc.fontSize(8).fillColor(C.crimson).text("AIMS PLAYBOOK", 0, 200, { align: "center", characterSpacing: 3 })

    // Title
    usePlayfair(doc)
    doc.fontSize(38).fillColor(C.black).text("The AI Operating", 0, 226, { align: "center" })
    doc.text("System", { align: "center" })
    usePlayfairItalic(doc)
    doc.fontSize(38).fillColor(C.crimson).text("for Business Owners.", { align: "center" })

    // Divider
    const divX = (PW - 50) / 2
    doc.rect(divX, doc.y + 14, 50, 2).fill(C.crimson)

    // Subtitle
    useInter(doc)
    doc.fontSize(11).fillColor(C.muted).text(
      "Roll out AI across every department without hiring\nor getting technical. Make this your playbook.",
      80, doc.y + 30, { align: "center", width: PW - 160, lineGap: 5 }
    )

    // Footer branding
    doc.fontSize(8).fillColor(C.muted).text("AI Operator Collective", 0, doc.page.height - 80, { align: "center" })
    doc.fontSize(7).fillColor(C.border).text("aioperatorcollective.com", 0, doc.y + 4, { align: "center" })

    // ═══════════════════════════════════════════════════════════════════════
    // WHAT YOU GET
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()

    heading2(doc, "What You Get")
    para(doc, "This playbook gives you the exact process for integrating AI across your business without needing to hire additional staff, learn technical skills, or build complex systems.")
    para(doc, "Our approach is implementing AI in a simple, practical way that enhances your existing operations, team, and workflows. Not just automation — an operating system where AI works alongside your team.")

    doc.moveDown(0.3)
    card(doc, "A 4-Part AI Deployment Playbook", "Remove costs, move faster, and scale without adding headcount.")
    card(doc, "A Master Prompt Template", "Paste once per chat. Your voice, style, and priorities stay locked in.")
    card(doc, "The RCCF Prompt Format", "Role, Context, Command, Format — consistent, high-quality AI output every time.")
    card(doc, "Department-Specific Prompt Libraries", "30+ ready-to-run prompts for Marketing, Sales, CS, Product, Engineering, and Ops.")

    callout(doc, "Most founders buy AI like it is a shiny object. Smart founders use AI like it is a competitive weapon. If you want to scale without burning cash, this is the playbook.")


    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: AUDIT
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Step 1")
    heading1(doc, "Audit the Business")
    para(doc, "Pinpoint where AI can immediately reclaim time, eliminate errors, and multiply output. AI only creates leverage when it is applied to bottlenecks.")

    heading2(doc, "Start With a Full Process Sweep")
    para(doc, "List every recurring task in each department. Rank them by time and money investment. Look for processes that are repetitive, rules-based, or rely on existing data. Those are your leverage points.")

    heading3(doc, "Sales")
    bullet(doc, "AI qualifies leads automatically based on behavior and fit signals")
    bullet(doc, "Predicts which prospects will close based on historical patterns")
    bullet(doc, "Auto-summarizes calls into CRM-ready notes and action items")

    heading3(doc, "Customer Success")
    bullet(doc, "Automates onboarding workflows and welcome sequences")
    bullet(doc, "Creates personalized follow-up sequences based on engagement")
    bullet(doc, "Auto-routes support tickets by urgency and category")

    heading3(doc, "Operations")
    bullet(doc, "Auto-generates schedules, assigns tasks, predicts workload surges")
    bullet(doc, "Inventory automation and demand forecasting")
    bullet(doc, "Internal AI helpdesk answers team questions instantly")

    heading3(doc, "Finance")
    bullet(doc, "Scan invoices, categorize expenses, chase missing receipts")
    bullet(doc, "Detect anomalies or fraud patterns in real-time")
    bullet(doc, "Predict cash shortages before they happen")

    heading3(doc, "HR and Recruiting")
    bullet(doc, "Automated resume filtering and candidate scoring")
    bullet(doc, "AI assistants handling interview scheduling")

    heading3(doc, "Marketing and Content")
    bullet(doc, "AI-written ads, posts, emails, blogs, and video scripts")
    bullet(doc, "Predictive targeting for highest-converting audiences")
    bullet(doc, "Automated content repurposing and scheduling")

    callout(doc, "Outcome: Walk away with 3 to 5 high-ROI opportunities where AI will instantly save time or money.")


    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Step 2")
    heading1(doc, "Choose the Right Tools")
    para(doc, "AI tools do not create leverage — workflows do. Your system should follow: Trigger → AI → Automation → Human in the Loop.")

    heading2(doc, "Recommended Tools by Function")
    const tw = [CW * 0.22, CW * 0.40, CW * 0.38]
    tableRow(doc, ["Function", "Tools", "What It Enables"], tw, true)
    tableRow(doc, ["Content", "Claude.ai, Copy.ai, Socialsweep", "Content at scale"], tw, false)
    tableRow(doc, ["Automation", "n8n.io, Make.com, Zapier", "Connect systems, no code"], tw, false)
    tableRow(doc, ["CRM / Sales", "HubSpot, Close CRM, Atlas", "Lead scoring, auto-replies"], tw, false)
    tableRow(doc, ["Support", "Zendesk AI, Intercom, Chatbase", "24/7 bots, routing"], tw, false)
    tableRow(doc, ["Analytics", "Precision.co, Frank AI", "Predictive dashboards"], tw, false)
    tableRow(doc, ["Voice/Video", "ElevenLabs, HeyGen", "AI voices, video gen"], tw, false)
    tableRow(doc, ["Hiring / HR", "HeroHire, Trainual", "Screening, scheduling"], tw, false)

    doc.moveDown(0.5)
    heading2(doc, "Map the Workflow")
    card(doc, "1. Trigger", "A lead opts in, a customer asks a question, or a task is created.")
    card(doc, "2. AI Processing", "AI labels, evaluates, drafts, or routes the input automatically.")
    card(doc, "3. Automation", "Data moves into your CRM, Slack, or task management system.")
    card(doc, "4. Human in the Loop", "Your team reviews only the exceptions. AI handles 80-90% of the work.")

    callout(doc, "Outcome: A clean workflow showing exactly where AI steps in and where humans take over.")


    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: TEST
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Step 3")
    heading1(doc, "Test, Automate, and Measure")
    para(doc, "Most companies over-engineer. Start tiny and scale only after the data says yes.")

    heading2(doc, "1. Start With One High-Value Process")
    para(doc, "Examples: lead qualification, appointment setting, content repurposing. Document the before numbers — hours spent, monthly cost, output quality.")

    heading2(doc, "2. Automate the Repetitive Steps")
    para(doc, "Lead fills form → AI drafts personalized email → CRM updates automatically → Slack pings sales rep.")

    heading2(doc, "3. Weekly Feedback Loops")
    bullet(doc, "Review AI outputs for accuracy and tone")
    bullet(doc, "Fix issues and improve prompts")
    bullet(doc, "Tighten logic and add edge case handling")

    heading2(doc, "4. Track These Core Metrics")
    const mw = [CW * 0.30, CW * 0.70]
    tableRow(doc, ["Metric", "What It Measures"], mw, true)
    tableRow(doc, ["Time Saved", "Hours eliminated per task per week"], mw, false)
    tableRow(doc, ["Cost", "Labor cost vs. automation cost"], mw, false)
    tableRow(doc, ["Consistency", "Percentage approved without edits"], mw, false)
    tableRow(doc, ["ROI", "(Savings + Revenue Lift - AI Cost) / AI Cost"], mw, false)

    doc.moveDown(0.3)
    callout(doc, "Outcome: A battle-tested AI system that runs reliably, improves over time, and prints operational efficiency.")


    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: SCALE
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Step 4")
    heading1(doc, "Scale Your AI Deployment")
    para(doc, "This is how you go from \"we are trying AI\" to \"we are an AI-driven company.\"")

    heading2(doc, "1. Standardize the Wins")
    para(doc, "Turn successful workflows into SOPs. Document in Notion, Google Drive, or your project management tool. This makes AI scalable and repeatable.")

    heading2(doc, "2. Build a Team That Thinks in Automations")
    bullet(doc, "Run monthly AI show-and-tell sessions to share wins")
    bullet(doc, "Assign an AI Champion in each department")
    bullet(doc, "Encourage bottom-up automation ideas from your team")

    heading2(doc, "3. Measure Quarterly Gains and Reinvest")
    para(doc, "Track savings, output gains, and speed improvements every quarter. Then reinvest those gains into more AI automation. AI is a flywheel — keep feeding it.")

    callout(doc, "This is exactly what AIMS does for our clients. We audit, deploy, measure, and scale AI across your entire operation — so you get the results without the learning curve.")

    ctaBox(doc, "Want us to do this for you?", "AIMS deploys AI infrastructure across your business so you can scale without adding headcount.", "Book a Strategy Call")


    // ═══════════════════════════════════════════════════════════════════════
    // MASTER PROMPT TEMPLATE
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    stepBadge(doc, "Prompt Library")
    heading1(doc, "Ready-to-Deploy Business Prompts")
    para(doc, "Start with the Master Prompt — it tells AI exactly how to show up for you. Then use the RCCF format for any task.")

    heading2(doc, "Company Master Prompt Template")

    const promptText = `"Hey, here is how to show up for me every time:

My name is [NAME]. I run [COMPANY], a [BUSINESS TYPE] that sells [OFFER] to [AUDIENCE]. I am an entrepreneur and operator. I like fast, clear answers that help me act today.

Voice and style: energetic, motivational, casual. Short sentences. Punchy lines. Keep it PG. Use American spelling. Grade 5 to 7 reading level.

My priorities: grow revenue, cut waste, free up time. I value leverage, speed, and clarity. Concrete examples over theory.

When you write for me: give me 3 options. Push back if my ask is weak. Offer a better path and say why.

QA: before you finish, do a 3-point quality check. 1) Is it simple. 2) Is it useful today. 3) Is the next step clear.

If info is missing, ask up to 3 short questions. If you have enough to act, act."`

    useInter(doc)
    const promptH = doc.fontSize(9).heightOfString(promptText, { width: CW - 28, lineGap: 3 })
    const promptY = doc.y + 4
    const promptBoxH = promptH + 30

    doc.roundedRect(M.left, promptY, CW, promptBoxH, 4).fill(C.bg)
    doc.rect(M.left, promptY, 3, promptBoxH).fill(C.crimson)

    doc.fontSize(7).fillColor(C.crimson).text("COPY AND CUSTOMIZE", M.left + 14, promptY + 8, { characterSpacing: 1.5 })
    doc.fontSize(9).fillColor(C.body).text(promptText, M.left + 14, doc.y + 6, { width: CW - 28, lineGap: 3 })

    doc.y = promptY + promptBoxH + 12

    heading2(doc, "RCCF Prompt Format")
    card(doc, "The universal format for any AI task", "Role: [ROLE]  |  Context: [GOAL + AUDIENCE + INPUTS]  |  Command: [ACTION]  |  Format: [OUTPUT FORMAT]")


    // ═══════════════════════════════════════════════════════════════════════
    // MARKETING PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Marketing Prompts")

    promptCard(doc, 1, "Short-Form Script Generator", "Act as a short-form video coach.", "Topic [TOPIC]. Audience [AUDIENCE]. CTA [CTA].", "Write 3 scripts using Point, Story, Lesson. Open with sharp pain, add true story, end with 1 lesson + CTA.", "Hook (1 line), Story (3-5 lines), Lesson (3 steps).")
    promptCard(doc, 2, "YouTube Long-Form Outline", "Act as a YouTube showrunner.", "Offer [OFFER]. Avatar [AVATAR]. Promise [PROMISE].", "Outline 10-12 min video with cold open, 3 loops, proof beats, soft CTA. Include b-roll ideas.", "Cold Open, Big Promise, Loop 1-3, Proof Stack, CTA, End Card.")
    promptCard(doc, 3, "Hook Bank from Customer Language", "Act as a voice-of-customer analyst.", "Inputs: call notes, reviews, comments at [LINKS].", "Extract 25 hooks in customer's own words. Tag each to a pain or desire.", "Table: Hook, Pain/Desire, Source, Use cases.")
    promptCard(doc, 4, "Ad Angles and Variations", "Act as a media buyer.", "Platform [META/YOUTUBE]. Audience [AUDIENCE]. Budget [BUDGET].", "Create 10 angles with 3 copy lines and 1 visual idea each. Keep claims grounded.", "Table: Angle, Lines, Visual idea, Proof note.")
    promptCard(doc, 5, "Newsletter Builder", "Act as a newsletter editor.", "List [SIZE]. Topic [TOPIC]. Offer [OFFER]. Voice [TONE].", "Write concise email: personal story, one lesson, one CTA.", "Subject, Preview, Body (Story, Lesson, CTA).")


    // ═══════════════════════════════════════════════════════════════════════
    // SALES PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Sales Prompts")

    promptCard(doc, 1, "Speed-to-Lead Callback Script", "Act as a sales responder.", "Offer [OFFER]. ICP [ICP]. Qual rules [RULES].", "Write fast callback script: confirm need, qualify lightly, set next step.", "Open (10s), Qual (3 points), Close (next step), Notes (CRM fields).")
    promptCard(doc, 2, "Sell-By-Chat DM Starters", "Act as a social seller.", "Platform [IG/LINKEDIN]. Audience [AUDIENCE]. Proof [LINKS].", "Write 10 human DM openers that invite reply without pressure.", "Token, Opener, Follow-up, 'If no reply' line.")
    promptCard(doc, 3, "Discovery Call Prep", "Act as a sales coach.", "Prospect [NAME], company [CO], pains [PAINS], outcome [OUTCOME].", "Draft discovery plan: confirm goals, budget fit, decision process.", "2-min opener, 5 questions, success criteria, red-flag checklist.")
    promptCard(doc, 4, "Objection Handling Playbook", "Act as an objection strategist.", "Segment [SEGMENT]. Objection [OBJECTION]. Proof [PROOF].", "Create 3 talk tracks (data, story, future-pace). Stay empathetic and honest.", "Track name, When to use, Script (4-6 lines), Proof.")


    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOMER SUCCESS + PRODUCT PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Customer Success Prompts")

    promptCard(doc, 1, "Day-0 Quick-Start Plan", "Act as an onboarding lead.", "Account [ACCOUNT]. Goal [VALUE]. Deadline [DATE].", "Build a plan that gets one meaningful win in week one.", "Checklist (3-5 steps), Owners, Acceptance criteria.")
    promptCard(doc, 2, "Risk Radar", "Act as a retention analyst.", "Usage [SIGNALS], tickets [TICKETS], sentiment [NOTES].", "Score risk and propose specific, time-bound save plays.", "Table: Risk level, Signal, Save play, Owner, Due date.")
    promptCard(doc, 3, "QBR Outline", "Act as a CSM.", "Account [ACCOUNT]. 90-day outcomes [METRICS]. Goals [GOALS].", "Draft QBR: highlights wins, insights, 90-day plan.", "Wins, Insights, Roadmap, Asks, Next steps.")
    promptCard(doc, 4, "Expansion Moment Script", "Act as a success-led seller.", "Milestone [MILESTONE]. Upsell [UPSELL].", "Brief outreach anchoring on earned results, proposing next step.", "3-line message + calendar link.")

    doc.moveDown(0.5)
    divider(doc)
    heading2(doc, "Product Prompts")

    promptCard(doc, 1, "Opportunity Ranking", "Act as a product strategist.", "Ideas [LIST]. Constraints [RESOURCES]. Strategy [OKRs].", "Rank by impact, confidence, effort with one-line rationale.", "Table: Idea, Impact, Confidence, Effort, Rationale.")
    promptCard(doc, 2, "One-Page Product Spec", "Act as a product manager.", "Problem [PROBLEM]. Users [USERS]. Metric [METRIC].", "Problem-first, minimal one-page spec.", "Problem, Users, Scope, Stories, Acceptance, Risks, Metric.")


    // ═══════════════════════════════════════════════════════════════════════
    // ENGINEERING + OPS PROMPTS + FINAL CTA
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Engineering Prompts")

    promptCard(doc, 1, "PR Review Summary", "Act as a senior reviewer.", "Repo [REPO]. Stack [STACK]. PR [TITLE]. Diff [NOTES].", "Concise review: risks, tests to add, merge readiness.", "Risks, Suggestions, Tests, Merge checklist.")
    promptCard(doc, 2, "Bug Triage", "Act as a triage lead.", "Steps [STEPS], expected [EXPECTED], actual [ACTUAL], sev [SEV].", "Reproducible steps, root causes, minimal fix plan.", "Repro, Suspects, Fix plan, Acceptance test.")
    promptCard(doc, 3, "Test Plan Scaffold", "Act as a QA lead.", "Component [COMPONENT], behavior [BEHAVIOR], edges [EDGES].", "Pragmatic test plan preventing regressions.", "Unit, Integration, Edge cases, Data/fixtures.")

    doc.moveDown(0.5)
    divider(doc)
    heading2(doc, "Operations and Finance Prompts")

    promptCard(doc, 1, "Weekly KPI Pack", "Act as an operator-analyst.", "Sources [CRM/ADS/BILLING]. Targets [TARGETS].", "One-page scorecard with trends and red flags.", "Table: KPI, Current, Trend, Target, Note, Action.")
    promptCard(doc, 2, "Month-End Close Checklist", "Act as a finance ops lead.", "Accounts [ACCOUNTS], deadlines [DATES], tool [TOOL].", "Close checklist with dependencies and controls.", "Steps, Owner, Due date, Control, Evidence link.")

    doc.moveDown(0.8)
    ctaBox(
      doc,
      "Ready to Deploy AI Today?",
      "Pick one department. Paste the Master Prompt. Run one RCCF prompt. Ship one asset today.",
      "Get Started with AIMS"
    )


    doc.flushPages()
    doc.end()
  })
}
