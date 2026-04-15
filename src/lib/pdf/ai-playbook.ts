import PDFDocument from "pdfkit"

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  gold: "#C4972A",
  ink: "#08090D",
  surface: "#141923",
  cream: "#F0EBE0",
  white: "#FFFFFF",
  muted: "#9CA3AF",
  lightGray: "#F4F4F5",
  darkText: "#1A1A2E",
  bodyText: "#374151",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pageFooter(doc: PDFKit.PDFDocument) {
  doc
    .fontSize(7)
    .fillColor(C.muted)
    .text("AIMS - AI Managing Services", 52, doc.page.height - 36, { continued: true, width: 250 })
    .text("aioperatorcollective.com", 52, doc.page.height - 36, { align: "right", width: doc.page.width - 104 })
}

function sectionHeader(doc: PDFKit.PDFDocument, step: string, title: string, goal: string) {
  // Dark header bar
  doc
    .rect(0, 0, doc.page.width, 110)
    .fill(C.ink)

  doc
    .fontSize(9)
    .fillColor(C.gold)
    .text(step, 52, 36, { characterSpacing: 2.5 })

  doc
    .fontSize(22)
    .fillColor(C.cream)
    .text(title, 52, 52, { width: doc.page.width - 104 })

  doc
    .fontSize(10)
    .fillColor(C.muted)
    .text(goal, 52, doc.y + 6, { width: doc.page.width - 104 })

  doc.y = 130
}

function heading2(doc: PDFKit.PDFDocument, text: string) {
  if (doc.y > doc.page.height - 120) doc.addPage()
  doc
    .moveDown(0.8)
    .fontSize(14)
    .fillColor(C.darkText)
    .text(text, { underline: false })
    .moveDown(0.4)
}

function heading3(doc: PDFKit.PDFDocument, text: string) {
  if (doc.y > doc.page.height - 100) doc.addPage()
  doc
    .moveDown(0.5)
    .fontSize(11)
    .fillColor(C.gold)
    .text(text)
    .moveDown(0.2)
}

function para(doc: PDFKit.PDFDocument, text: string) {
  doc
    .fontSize(10)
    .fillColor(C.bodyText)
    .text(text, { lineGap: 4, width: doc.page.width - 104 })
    .moveDown(0.4)
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  const x = doc.x
  doc
    .fontSize(10)
    .fillColor(C.gold)
    .text("- ", x, doc.y, { continued: true })
    .fillColor(C.bodyText)
    .text(text, { lineGap: 3 })
  doc.moveDown(0.15)
}

function card(doc: PDFKit.PDFDocument, title: string, body: string) {
  if (doc.y > doc.page.height - 100) doc.addPage()
  const startY = doc.y
  const cardX = 52
  const cardW = doc.page.width - 104

  // Card background
  doc
    .rect(cardX, startY, cardW, 1) // placeholder height, will adjust

  // Gold left border
  doc
    .rect(cardX, startY, 3, 60)
    .fill(C.gold)

  // Background
  doc
    .rect(cardX + 3, startY, cardW - 3, 60)
    .fill(C.lightGray)

  // Title
  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(title, cardX + 14, startY + 10, { width: cardW - 28 })

  // Body
  doc
    .fontSize(9)
    .fillColor(C.bodyText)
    .text(body, cardX + 14, doc.y + 2, { width: cardW - 28, lineGap: 3 })

  const endY = doc.y + 10
  const cardH = endY - startY

  // Redraw background with correct height
  doc
    .rect(cardX, startY, 3, cardH)
    .fill(C.gold)
  doc
    .rect(cardX + 3, startY, cardW - 3, cardH)
    .fill(C.lightGray)

  // Re-render text on top
  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(title, cardX + 14, startY + 10, { width: cardW - 28 })
  doc
    .fontSize(9)
    .fillColor(C.bodyText)
    .text(body, cardX + 14, doc.y + 2, { width: cardW - 28, lineGap: 3 })

  doc.y = doc.y + 14
}

function callout(doc: PDFKit.PDFDocument, text: string) {
  if (doc.y > doc.page.height - 100) doc.addPage()
  const startY = doc.y + 8
  const x = 52
  const w = doc.page.width - 104

  doc
    .rect(x, startY, 3, 50)
    .fill(C.gold)
  doc
    .rect(x + 3, startY, w - 3, 50)
    .fill("#FEF9EC")

  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(text, x + 14, startY + 12, { width: w - 28, lineGap: 4 })

  const h = doc.y + 12 - startY

  // Redraw with correct height
  doc
    .rect(x, startY, 3, h)
    .fill(C.gold)
  doc
    .rect(x + 3, startY, w - 3, h)
    .fill("#FEF9EC")
  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(text, x + 14, startY + 12, { width: w - 28, lineGap: 4 })

  doc.y = doc.y + 16
}

function ctaBox(doc: PDFKit.PDFDocument, title: string, body: string, buttonText: string) {
  if (doc.y > doc.page.height - 160) doc.addPage()
  const x = 52
  const w = doc.page.width - 104
  const startY = doc.y + 10

  doc
    .roundedRect(x, startY, w, 130, 6)
    .fill(C.ink)

  doc
    .fontSize(16)
    .fillColor(C.cream)
    .text(title, x + 28, startY + 20, { width: w - 56, align: "center" })

  doc
    .fontSize(10)
    .fillColor(C.muted)
    .text(body, x + 28, doc.y + 6, { width: w - 56, align: "center", lineGap: 3 })

  // Button
  const btnY = doc.y + 10
  const btnW = 180
  const btnX = x + (w - btnW) / 2
  doc
    .roundedRect(btnX, btnY, btnW, 32, 4)
    .fill(C.gold)
  doc
    .fontSize(9)
    .fillColor(C.white)
    .text(buttonText.toUpperCase(), btnX, btnY + 10, { width: btnW, align: "center", characterSpacing: 1 })

  doc.y = btnY + 50
}

function promptCard(doc: PDFKit.PDFDocument, num: number, title: string, role: string, context: string, command: string, format: string) {
  if (doc.y > doc.page.height - 130) doc.addPage()
  const x = 52
  const w = doc.page.width - 104
  const startY = doc.y + 4

  doc
    .roundedRect(x, startY, w, 10, 4) // placeholder
    .fill("#F9FAFB")

  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(`${num}. ${title}`, x + 12, startY + 8, { width: w - 24 })

  doc
    .fontSize(8.5)
    .fillColor(C.bodyText)
  doc.text(`Role: ${role}`, x + 12, doc.y + 4, { width: w - 24 })
  doc.text(`Context: ${context}`, { width: w - 24 })
  doc.text(`Command: ${command}`, { width: w - 24 })
  doc.text(`Format: ${format}`, { width: w - 24 })

  const h = doc.y + 10 - startY

  // Redraw bg
  doc
    .roundedRect(x, startY, w, h, 4)
    .fill("#F9FAFB")

  // Re-render text
  doc
    .fontSize(10)
    .fillColor(C.darkText)
    .text(`${num}. ${title}`, x + 12, startY + 8, { width: w - 24 })
  doc
    .fontSize(8.5)
    .fillColor(C.bodyText)
  doc.text(`Role: ${role}`, x + 12, doc.y + 4, { width: w - 24 })
  doc.text(`Context: ${context}`, { width: w - 24 })
  doc.text(`Command: ${command}`, { width: w - 24 })
  doc.text(`Format: ${format}`, { width: w - 24 })

  doc.y = doc.y + 12
}

function tableRow(doc: PDFKit.PDFDocument, cols: string[], widths: number[], isHeader: boolean) {
  if (doc.y > doc.page.height - 60) doc.addPage()
  const x = 52
  const rowY = doc.y
  const rowH = 22

  if (isHeader) {
    doc.rect(x, rowY, doc.page.width - 104, rowH).fill(C.ink)
    doc.fontSize(8).fillColor(C.cream)
  } else {
    doc.rect(x, rowY, doc.page.width - 104, rowH).fill(C.lightGray)
    doc.fontSize(8.5).fillColor(C.bodyText)
  }

  let colX = x + 8
  cols.forEach((col, i) => {
    doc.text(col, colX, rowY + 6, { width: widths[i], lineBreak: false })
    colX += widths[i]
  })

  doc.y = rowY + rowH + 1
}

// ─── Main Document Builder ───────────────────────────────────────────────────

export function buildAIPlaybookPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 48, bottom: 60, left: 52, right: 52 },
      info: {
        Title: "The AI Operating System - AIMS Playbook",
        Author: "AIMS - AI Managing Services",
        Subject: "Deploy AI across every department without hiring or getting technical",
      },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pw = doc.page.width
    const contentW = pw - 104

    // ═══════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════
    doc
      .rect(0, 0, pw, doc.page.height)
      .fill(C.ink)

    doc
      .fontSize(10)
      .fillColor(C.gold)
      .text("AIMS PLAYBOOK", 0, 260, { align: "center", characterSpacing: 3 })

    doc
      .fontSize(34)
      .fillColor(C.cream)
      .text("The AI Operating", 0, 290, { align: "center" })
      .text("System for", { align: "center" })
      .text("Business Owners", { align: "center" })

    // Gold divider
    const divX = (pw - 60) / 2
    doc
      .rect(divX, doc.y + 16, 60, 2)
      .fill(C.gold)

    doc
      .fontSize(12)
      .fillColor(C.muted)
      .text(
        "Roll out AI across every department without hiring or getting technical. Make this your playbook. It is simple, fast, and real.",
        80,
        doc.y + 34,
        { align: "center", width: pw - 160, lineGap: 5 }
      )

    doc
      .fontSize(8)
      .fillColor(C.muted)
      .text("AI Managing Services - aioperatorcollective.com", 0, doc.page.height - 80, { align: "center", characterSpacing: 1.5 })

    // ═══════════════════════════════════════════════════════════════════════
    // WHAT YOU GET
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()

    heading2(doc, "What You Get")

    para(doc, "This playbook gives you the exact process for integrating AI across your business without needing to hire additional staff, learn technical skills, or build complex systems.")
    para(doc, "Our approach is implementing AI in a simple, practical way that enhances your existing operations, team, and workflows. This is not just about automation but creating an operating system where AI works alongside your team, driving results that feel effortless and sustainable.")

    doc.moveDown(0.5)
    card(doc, "A 4-Part AI Deployment Playbook", "Remove costs, move faster, and scale without adding headcount. The exact process used by 8-figure operators.")
    card(doc, "A Master Prompt Template", "A plug-and-play template you can edit and use across your entire team. Paste once, stay consistent forever.")
    card(doc, "The RCCF Prompt Format", "Role, Context, Command, Format - the structured prompt framework that gets consistent, high-quality AI output every time.")
    card(doc, "Department-Specific Prompt Libraries", "Ready-to-run prompts for Marketing, Sales, Customer Success, Product, Engineering, and Operations.")

    callout(doc, "Most founders buy AI like it is a shiny object. Smart founders use AI like it is a competitive weapon. If you want to scale without burning cash, this is the playbook.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: AUDIT
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    sectionHeader(doc, "STEP 1", "Audit the Business and Expose the Opportunities", "Pinpoint where AI can immediately reclaim time, eliminate errors, and multiply output.")

    para(doc, "AI only creates leverage when it is applied to bottlenecks. Before you buy a single tool, you need a brutally honest operational audit.")

    heading2(doc, "Start With a Full Process Sweep")
    para(doc, "List every recurring task in each department. Rank them by time investment and money investment. Look for processes that are repetitive, rules-based, or rely on data that already exists. Those are your leverage points.")

    heading2(doc, "Where AI Delivers the Fastest Wins")

    heading3(doc, "Sales")
    bullet(doc, "AI qualifies leads automatically based on behavior and fit signals")
    bullet(doc, "Predicts which prospects will close based on historical patterns")
    bullet(doc, "Auto-summarizes calls into CRM-ready notes and action items")

    heading3(doc, "Customer Success")
    bullet(doc, "Automates onboarding workflows and welcome sequences")
    bullet(doc, "Creates personalized follow-up sequences based on engagement")
    bullet(doc, "Auto-routes support tickets by urgency and category")

    heading3(doc, "Operations")
    bullet(doc, "Auto-generates schedules, assigns tasks, and predicts workload surges")
    bullet(doc, "Inventory automation and demand forecasting")
    bullet(doc, "Internal AI helpdesk answers team questions instantly")

    heading3(doc, "Finance")
    bullet(doc, "Scan invoices, categorize expenses, chase missing receipts")
    bullet(doc, "Detect anomalies or fraud patterns in real-time")
    bullet(doc, "Predict cash shortages before they happen")

    heading3(doc, "HR and Recruiting")
    bullet(doc, "Automated resume filtering and candidate scoring")
    bullet(doc, "AI assistants handling interview scheduling")
    bullet(doc, "Sentiment analysis on employee feedback")

    heading3(doc, "Marketing and Content")
    bullet(doc, "AI-written ads, posts, emails, blogs, and video scripts")
    bullet(doc, "Predictive targeting for highest-converting audiences")
    bullet(doc, "Automated content repurposing and scheduling")

    callout(doc, "Outcome: Walk away with 3 to 5 high-ROI opportunities where AI will instantly save time or money.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: TOOLS + WORKFLOW
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    sectionHeader(doc, "STEP 2", "Choose the Right Tools and Build the Workflow", "Integrate AI into your existing systems so it feels seamless, not chaotic.")

    para(doc, "AI tools do not create leverage. Workflows do. Here is how to build them like a pro.")

    heading2(doc, "Recommended Tools by Function")

    const tw = [contentW * 0.22, contentW * 0.40, contentW * 0.38]
    tableRow(doc, ["FUNCTION", "TOOLS", "WHAT IT ENABLES"], tw, true)
    tableRow(doc, ["Content Creation", "Claude.ai, Copy.ai, Socialsweep.ai", "High-quality content at scale"], tw, false)
    tableRow(doc, ["Automation", "n8n.io, Make.com, Zapier", "Connect systems without code"], tw, false)
    tableRow(doc, ["CRM & Sales", "HubSpot, Close CRM, Atlas", "Lead scoring, auto-replies, summaries"], tw, false)
    tableRow(doc, ["Support", "Zendesk AI, Intercom, Chatbase", "24/7 FAQ bots, routing, delivery"], tw, false)
    tableRow(doc, ["Analytics", "Precision.co, Frank AI", "Predictive dashboards and insights"], tw, false)
    tableRow(doc, ["Voice / Video", "ElevenLabs, HeyGen", "AI voices, video generation, clipping"], tw, false)
    tableRow(doc, ["Hiring / HR", "HeroHire, Trainual", "Screening + candidate communication"], tw, false)

    heading2(doc, "Map the Workflow")
    para(doc, "Your AI system should follow this pattern:")
    card(doc, "1. Trigger", "A lead opts in, a customer asks a question, or a task is created.")
    card(doc, "2. AI Processing", "AI labels, evaluates, drafts, or routes the input automatically.")
    card(doc, "3. Automation", "Data moves into your CRM, Slack, or task management system.")
    card(doc, "4. Human in the Loop", "Your team reviews only the exceptions. AI handles 80-90% of the repetitive work.")

    callout(doc, "Outcome: A clean, visual workflow showing exactly where AI steps in and where humans take over.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: TEST + MEASURE
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    sectionHeader(doc, "STEP 3", "Test, Automate, and Measure", "Prove ROI fast and scale only what works.")

    para(doc, "Most companies over-engineer. You are going to start tiny and scale up only after the data says yes.")

    heading2(doc, "1. Start With One High-Value Process")
    para(doc, "Examples: lead qualification, appointment setting, content repurposing. Document the before numbers - hours spent, monthly cost, and output quality.")

    heading2(doc, "2. Automate the Repetitive Steps")
    para(doc, "Example system: Lead fills form -> AI drafts personalized email -> CRM updates automatically -> Slack pings sales rep")

    heading2(doc, "3. Weekly Feedback Loops")
    bullet(doc, "Review AI outputs for accuracy and tone")
    bullet(doc, "Fix issues and improve prompts")
    bullet(doc, "Tighten logic and add edge case handling")

    heading2(doc, "4. Track These Core Metrics")
    const mw = [contentW * 0.30, contentW * 0.70]
    tableRow(doc, ["METRIC", "WHAT IT MEASURES"], mw, true)
    tableRow(doc, ["Time Saved", "Hours eliminated per task per week"], mw, false)
    tableRow(doc, ["Cost", "Labor cost vs. automation cost"], mw, false)
    tableRow(doc, ["Output Consistency", "Percentage of outputs approved without edits"], mw, false)
    tableRow(doc, ["ROI", "(Savings + Revenue Lift - AI Cost) / AI Cost"], mw, false)

    heading2(doc, "5. Scale What Works")
    para(doc, "Once a workflow proves ROI, replicate it in other departments. Do not scale anything that has not proven itself first.")

    callout(doc, "Outcome: A battle-tested AI system that runs reliably, improves over time, and prints operational efficiency.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: SCALE
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    sectionHeader(doc, "STEP 4", "Scale Your AI Deployment", "Turn AI from a tool into a company-wide operating system.")

    para(doc, "This is how you go from \"we are trying AI\" to \"we are an AI-driven company.\"")

    heading2(doc, "1. Standardize the Wins")
    para(doc, "Turn successful workflows into SOPs. Document in Notion, Google Drive, or your project management tool. This makes AI scalable and repeatable.")

    heading2(doc, "2. Build a Team That Thinks in Automations")
    bullet(doc, "Run monthly AI show-and-tell sessions to share wins")
    bullet(doc, "Assign an AI Champion in each department")
    bullet(doc, "Encourage bottom-up automation ideas from your team")

    heading2(doc, "3. Measure Quarterly Gains and Reinvest")
    para(doc, "Track savings, output gains, and speed improvements every quarter. Then reinvest those gains into more AI automation. AI is a flywheel - keep feeding it.")

    callout(doc, "This is exactly what AIMS does for our clients. We audit, deploy, measure, and scale AI across your entire operation - so you get the results without the learning curve.")

    ctaBox(doc, "Want us to do this for you?", "AIMS deploys AI infrastructure across your business so you can scale without adding headcount.", "Book a Strategy Call")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // PROMPT LIBRARY INTRO + MASTER PROMPT
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    sectionHeader(doc, "PROMPT LIBRARY", "Ready-to-Deploy Business Prompts", "Start with the Master Prompt, then use RCCF format for any task.")

    para(doc, "Want AI to work like a top hire in every part of your business? Start with the Master Prompt - it tells the AI exactly how to show up for you. Paste it once per chat and your voice, style, and priorities stay locked in.")

    heading2(doc, "Company Master Prompt Template")
    para(doc, "Paste this once per chat. Keep it at the top of your project chat.")

    // Master prompt in a box
    const mpX = 52
    const mpW = contentW
    const mpY = doc.y + 4

    doc
      .fontSize(8)
      .fillColor(C.gold)
      .text("MASTER PROMPT - COPY AND CUSTOMIZE", mpX + 12, mpY + 8, { characterSpacing: 1 })

    doc
      .fontSize(8.5)
      .fillColor(C.bodyText)
      .text(
        `"Hey, here is how to show up for me every time:

My name is [NAME]. I run [COMPANY], a [BUSINESS TYPE] that sells [OFFER] to [AUDIENCE]. I am an entrepreneur and operator. I like fast, clear answers that help me act today.

Voice and style: energetic, motivational, casual. Short sentences. Punchy lines. Conversational flow. Keep it PG. Use American spelling. Use simple words. Grade 5 to 7 reading level.

My priorities: grow revenue, cut waste, free up time. I value leverage, speed, and clarity. I prefer concrete examples over theory.

When you write for me: give me 3 options when choosing. Push back if my ask is weak. Offer a better path and say why.

Constraints: avoid buzzwords. Avoid vague claims. If a claim needs proof, cite a simple number or show a test to run.

QA: before you finish, do a 3-point quality check. 1) Is it simple. 2) Is it useful today. 3) Is the next step clear.

If info is missing, ask me up to 3 short questions. If you have enough to act, act. Do not stall."`,
        mpX + 12,
        doc.y + 6,
        { width: mpW - 24, lineGap: 3 }
      )

    const mpH = doc.y + 10 - mpY
    doc
      .roundedRect(mpX, mpY, mpW, mpH, 4)
      .stroke("#E5E7EB")

    doc.y = doc.y + 16

    heading2(doc, "RCCF Prompt Format")
    card(doc, "The universal format for any AI task", "Role: [ROLE]\nContext: [GOAL]. Audience: [AUDIENCE]. Inputs: [NUMBERS/LINKS]. Constraints: [RULES].\nCommand: [ACTION]. Give 3 options and a better path if you see one.\nFormat: [OUTPUT FORMAT]. End with a CTA. Run the 3-point QA.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // MARKETING PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Marketing Prompts")
    para(doc, "Create a shared project named \"Marketing\" in your AI tool, paste the Master Prompt, and start using these.")

    promptCard(doc, 1, "Short-Form Script Generator", "Act as a short-form video coach.", "Topic is [TOPIC]. Audience is [AUDIENCE]. Desired action is [CTA].", "Write 3 scripts using Point, Story, Lesson format. Open with a sharp pain, add a true story, end with 1 actionable lesson and CTA.", "For each script: Hook (1 line), Story (3-5 lines), Lesson (3 steps).")
    promptCard(doc, 2, "YouTube Long-Form Outline", "Act as a YouTube showrunner.", "Offer [OFFER]. Avatar [AVATAR]. Core promise [PROMISE].", "Outline a 10-12 minute video with cold open hook, 3 loops, proof beats, and a soft CTA. Include b-roll ideas.", "Sections: Cold Open, Big Promise, Loop 1, Loop 2, Loop 3, Proof Stack, CTA, End Card.")
    promptCard(doc, 3, "Hook Bank from Customer Language", "Act as a voice-of-customer analyst.", "Inputs: call notes, reviews, comments at [LINKS].", "Extract 25 hooks in the customer's own words. Tag each hook to a pain or desire.", "Table with Hook, Pain/Desire, Source link, Use cases (Short, Email, Ad).")
    promptCard(doc, 4, "Ad Angles and Variations", "Act as a media buyer.", "Platform [META or YOUTUBE]. Audience [AUDIENCE]. Budget [BUDGET].", "Create 10 angles. Each angle includes 3 copy lines and 1 visual idea. Keep claims grounded in proof.", "Table: Angle name, Lines (1-2 sentences each), Visual idea, Proof note.")
    promptCard(doc, 5, "Newsletter Builder", "Act as a newsletter editor.", "List size [SIZE]. Topic [TOPIC]. Offer [OFFER]. Voice [TONE].", "Write a concise email using a personal story, one lesson, one CTA.", "Subject, Preview, Body (Story, Lesson, CTA link).")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // SALES PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Sales Prompts")
    para(doc, "Create a shared project named \"Sales\" in your AI tool, paste the Master Prompt, and start using these.")

    promptCard(doc, 1, "Speed-to-Lead Callback Script", "Act as a sales responder.", "Offer [OFFER]. ICP [ICP]. Qual rules [QUAL_RULES].", "Write a fast callback script that confirms need, qualifies lightly, and sets the next step.", "Open (10s), Qual (3 points), Close (next step + time), Notes (CRM fields).")
    promptCard(doc, 2, "Sell-By-Chat DM Starters", "Act as a social seller.", "Platform [INSTAGRAM/LINKEDIN]. Audience [AUDIENCE]. Proof [PROOF_LINKS].", "Write 10 human DM openers that invite a reply without pressure. Include light personalization tokens.", "Bullets with Token, Opener, Follow-up nudge, 'If no reply' line.")
    promptCard(doc, 3, "Discovery Call Prep", "Act as a sales coach.", "Prospect [NAME], company [COMPANY], pains [PAINS], desired outcome [OUTCOME].", "Draft a short discovery plan that confirms goals, budget fit, and decision process.", "2-min opener, 5 discovery questions, success criteria, red-flag checklist.")
    promptCard(doc, 4, "Objection Handling Playbook", "Act as an objection-handling strategist.", "Segment [SEGMENT]. Common objection [OBJECTION]. Proof [PROOF].", "Create 3 talk tracks using different frames (data, story, future-pace) that stay empathetic and honest.", "Track name, When to use, Script (4-6 lines), Optional proof.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOMER SUCCESS PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Customer Success Prompts")

    promptCard(doc, 1, "Day-0 Quick-Start Plan", "Act as an onboarding lead.", "Account [ACCOUNT]. Goal [VALUE]. Deadline [DATE]. Tier [TIER].", "Build a simple plan that gets one meaningful win in week one.", "Checklist (3-5 steps), Owners, Acceptance criteria, Welcome note.")
    promptCard(doc, 2, "Risk Radar", "Act as a retention analyst.", "Usage [USAGE SIGNALS], tickets [TICKETS], sentiment [NOTES].", "Score risk and propose save plays that are specific and time-bound.", "Table with Risk level, Signal, Save play, Owner, Due date.")
    promptCard(doc, 3, "QBR Outline", "Act as a CSM.", "Account [ACCOUNT]. Last 90-day outcomes [METRICS]. Upcoming goals [GOALS].", "Draft a QBR flow that highlights wins, insights, and a 90-day plan.", "Sections: Wins, Insights, Roadmap, Asks, Next steps.")
    promptCard(doc, 4, "Expansion Moment Script", "Act as a success-led seller.", "Milestone hit [MILESTONE]. Relevant offer [UPSELL].", "Create a brief outreach that anchors on earned results and proposes a next step.", "3-line message + calendar link line.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCT PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Product Prompts")

    promptCard(doc, 1, "Opportunity Ranking", "Act as a product strategist.", "Candidate ideas [LIST]. Constraints [RESOURCES]. Strategy [OKRs].", "Rank opportunities by impact, confidence, and effort with a one-line rationale.", "Table: Idea, Impact, Confidence, Effort, Rationale.")
    promptCard(doc, 2, "One-Page Product Spec", "Act as a product manager.", "Problem [PROBLEM]. Users [USERS]. Success metric [METRIC].", "Write a one-page spec that is problem-first and minimal.", "Problem, Users, Scope, User stories, Acceptance, Risks, Success metric.")
    promptCard(doc, 3, "Experiment Design", "Act as a growth PM.", "Hypothesis [HYPOTHESIS], sample [SEGMENT], constraint [BUDGET/TIME].", "Design a simple test with pass/fail and decision rule.", "Hypothesis, Metric, Threshold, Steps, Decision rule, Next action.")
    promptCard(doc, 4, "Voice-of-Customer Digest", "Act as an insights analyst.", "Sources [CALLS/REVIEWS/TICKETS].", "Summarize top 5 themes with quotes and suggested product actions.", "Table: Theme, Quote, Source, Action idea.")
    promptCard(doc, 5, "Release Notes", "Act as a release editor.", "Feature [FEATURE]. Benefits [BENEFITS]. Affected users [SEGMENTS].", "Write short notes that explain what changed and why it matters.", "Title, What's new, Why it matters, How to use it, Links.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // ENGINEERING PROMPTS
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Engineering Prompts")

    promptCard(doc, 1, "PR Review Summary", "Act as a senior reviewer.", "Repo [REPO]. Stack [STACK]. PR title [TITLE]. Diff notes [NOTES].", "Produce a concise review that surfaces risks, tests to add, and merge readiness.", "Risks, Suggestions, Tests, Merge checklist.")
    promptCard(doc, 2, "Bug Triage", "Act as a triage lead.", "Steps to reproduce [STEPS], expected [EXPECTED], actual [ACTUAL], severity [SEV].", "Draft reproducible steps, likely root causes, and a minimal fix plan.", "Repro, Suspects, Fix plan, Acceptance test.")
    promptCard(doc, 3, "Doc Update", "Act as a docs scribe.", "Feature [FEATURE], entry points [FILES/LINKS].", "Update README/guide with setup, usage, and examples.", "Section headings with short instructions and example blocks.")
    promptCard(doc, 4, "Test Plan Scaffold", "Act as a QA lead.", "Component [COMPONENT], behavior [BEHAVIOR], edge cases [EDGES].", "Outline a pragmatic test plan that prevents regressions.", "Unit cases, Integration cases, Edge cases, Data/fixtures.")
    promptCard(doc, 5, "Release Checklist", "Act as a release manager.", "Version [VERSION], envs [ENVS], CI/CD [TOOL].", "Provide a pre-release checklist that is safe and fast.", "Pre-checks, Steps, Rollback notes, Owner.")

    pageFooter(doc)

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATIONS PROMPTS + FINAL CTA
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage()
    heading2(doc, "Operations and Finance Prompts")

    promptCard(doc, 1, "Weekly KPI Pack", "Act as an operator-analyst.", "Sources [CRM/ADS/BILLING]. Targets [TARGETS].", "Create a one-page scorecard with trends and red flags.", "Table: KPI, Current, Trend, Target, Note, Action.")
    promptCard(doc, 2, "Month-End Close Checklist", "Act as a finance ops lead.", "Accounts [ACCOUNTS], deadlines [DATES], tool [ACCOUNTING_TOOL].", "Draft a close checklist with dependencies and controls.", "Steps, Owner, Due date, Control, Evidence link.")
    promptCard(doc, 3, "Daily Cash and Anomalies", "Act as a finance sentinel.", "Data [BANKS/STRIPE], thresholds [ALERT_RULES].", "Generate a daily summary with anomalies and a simple next action.", "Cash by account, In/Out, Anomalies, Action.")

    doc.moveDown(1)

    ctaBox(
      doc,
      "Ready to Deploy AI Today?",
      "Pick one department. Paste the Master Prompt. Run one RCCF prompt. Ship one asset today. Want AIMS to handle the heavy lifting?",
      "Get Started with AIMS"
    )

    pageFooter(doc)

    doc.end()
  })
}
