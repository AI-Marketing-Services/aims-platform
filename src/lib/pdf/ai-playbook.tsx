import React from "react"
import { Document, Page, Text, View, StyleSheet, Font, Link } from "@react-pdf/renderer"

// ─── Fonts ───────────────────────────────────────────────────────────────────

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAop9hTmf3ZGMZpg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJ1hTmf3ZGMZpg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAuZ1hTmf3ZGMZpg.ttf", fontWeight: 700 },
  ],
})

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  gold: "#C4972A",
  ink: "#08090D",
  surface: "#141923",
  cream: "#F0EBE0",
  white: "#FFFFFF",
  muted: "#9CA3AF",
  border: "#2A2F3C",
  lightGray: "#F4F4F5",
  darkText: "#1A1A2E",
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: C.white,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 52,
    fontSize: 10.5,
    lineHeight: 1.65,
    color: C.darkText,
  },
  // Cover page
  coverPage: {
    fontFamily: "DM Sans",
    backgroundColor: C.ink,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
  },
  coverBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: C.gold,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: C.cream,
    textAlign: "center",
    lineHeight: 1.2,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 400,
    marginBottom: 40,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: C.gold,
    marginBottom: 40,
  },
  coverFooter: {
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  // Section headers
  sectionHeader: {
    backgroundColor: C.ink,
    paddingVertical: 32,
    paddingHorizontal: 52,
    marginBottom: 28,
    marginHorizontal: -52,
    marginTop: -48,
  },
  sectionStep: {
    fontSize: 10,
    fontWeight: 600,
    color: C.gold,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: C.cream,
    lineHeight: 1.25,
  },
  sectionGoal: {
    fontSize: 11,
    color: C.muted,
    marginTop: 8,
    lineHeight: 1.5,
  },
  // Content
  h2: {
    fontSize: 16,
    fontWeight: 700,
    color: C.darkText,
    marginTop: 20,
    marginBottom: 10,
  },
  h3: {
    fontSize: 13,
    fontWeight: 700,
    color: C.gold,
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.65,
    color: "#374151",
    marginBottom: 10,
  },
  bold: {
    fontWeight: 700,
    color: C.darkText,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 14,
    fontSize: 10.5,
    color: C.gold,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.55,
    color: "#374151",
  },
  // Cards
  card: {
    backgroundColor: C.lightGray,
    borderRadius: 6,
    padding: 16,
    marginBottom: 10,
    borderLeft: `3px solid ${C.gold}`,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.darkText,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#4B5563",
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.ink,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: C.cream,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableCell: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.4,
  },
  // Callout
  callout: {
    backgroundColor: "#FEF9EC",
    borderLeft: `3px solid ${C.gold}`,
    borderRadius: 6,
    padding: 16,
    marginVertical: 14,
  },
  calloutText: {
    fontSize: 11,
    fontWeight: 600,
    color: C.darkText,
    lineHeight: 1.55,
  },
  // CTA box
  ctaBox: {
    backgroundColor: C.ink,
    borderRadius: 8,
    padding: 28,
    alignItems: "center",
    marginTop: 24,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: C.cream,
    marginBottom: 10,
    textAlign: "center",
  },
  ctaText: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  ctaButton: {
    backgroundColor: C.gold,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  ctaButtonText: {
    fontSize: 11,
    fontWeight: 700,
    color: C.white,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  // Prompt section
  promptBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    border: `1px solid #E5E7EB`,
    padding: 14,
    marginBottom: 10,
  },
  promptLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: C.gold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  promptText: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: "#374151",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerPage: {
    fontSize: 8,
    color: C.muted,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 18,
  },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>-</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardBody}>{body}</Text>
    </View>
  )
}

function SectionPage({
  step,
  title,
  goal,
  children,
}: {
  step: string
  title: string
  goal: string
  children: React.ReactNode
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionStep}>{step}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionGoal}>{goal}</Text>
      </View>
      {children}
      <PageFooter />
    </Page>
  )
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>AIMS - AI Managing Services</Text>
      <Text style={s.footerText}>aioperatorcollective.com</Text>
    </View>
  )
}

function PromptCard({
  number,
  title,
  role,
  context,
  command,
  format,
}: {
  number: number
  title: string
  role: string
  context: string
  command: string
  format: string
}) {
  return (
    <View style={s.promptBox} wrap={false}>
      <Text style={s.cardTitle}>
        {number}. {title}
      </Text>
      <View style={{ marginTop: 6 }}>
        <Text style={s.promptText}>
          <Text style={s.bold}>Role: </Text>
          {role}
        </Text>
        <Text style={s.promptText}>
          <Text style={s.bold}>Context: </Text>
          {context}
        </Text>
        <Text style={s.promptText}>
          <Text style={s.bold}>Command: </Text>
          {command}
        </Text>
        <Text style={s.promptText}>
          <Text style={s.bold}>Format: </Text>
          {format}
        </Text>
      </View>
    </View>
  )
}

// ─── Document ────────────────────────────────────────────────────────────────

export function AIPlaybookDocument() {
  return (
    <Document
      title="The AI Operating System - AIMS Playbook"
      author="AIMS - AI Managing Services"
      subject="Deploy AI across every department without hiring or getting technical"
    >
      {/* ─── Cover ─── */}
      <Page size="LETTER" style={s.coverPage}>
        <Text style={s.coverBadge}>AIMS PLAYBOOK</Text>
        <Text style={s.coverTitle}>The AI Operating{"\n"}System for{"\n"}Business Owners</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverSubtitle}>
          Roll out AI across every department without hiring or getting technical.
          Make this your playbook. It is simple, fast, and real.
        </Text>
        <Text style={s.coverFooter}>AI Managing Services - aioperatorcollective.com</Text>
      </Page>

      {/* ─── What You Get ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>What You Get</Text>
        <Text style={s.paragraph}>
          This playbook gives you the exact process for integrating AI across your business without needing to hire additional staff, learn technical skills, or build complex systems.
        </Text>
        <Text style={s.paragraph}>
          Our approach is implementing AI in a simple, practical way that enhances your existing operations, team, and workflows. This is not just about automation but creating an operating system where AI works alongside your team, driving results that feel effortless and sustainable.
        </Text>
        <View style={s.divider} />
        <Card
          title="A 4-Part AI Deployment Playbook"
          body="Remove costs, move faster, and scale without adding headcount. The exact process used by 8-figure operators."
        />
        <Card
          title="A Master Prompt Template"
          body="A plug-and-play template you can edit and use across your entire team. Paste once, stay consistent forever."
        />
        <Card
          title="The RCCF Prompt Format"
          body="Role, Context, Command, Format - the structured prompt framework that gets consistent, high-quality AI output every time."
        />
        <Card
          title="Department-Specific Prompt Libraries"
          body="Ready-to-run prompts for Marketing, Sales, Customer Success, Product, Engineering, and Operations."
        />
        <View style={s.callout}>
          <Text style={s.calloutText}>
            Most founders buy AI like it is a shiny object. Smart founders use AI like it is a competitive weapon. If you want to scale without burning cash, this is the playbook.
          </Text>
        </View>
        <PageFooter />
      </Page>

      {/* ─── Step 1: Audit ─── */}
      <SectionPage
        step="STEP 1"
        title="Audit the Business and Expose the Opportunities"
        goal="Pinpoint where AI can immediately reclaim time, eliminate errors, and multiply output."
      >
        <Text style={s.paragraph}>
          AI only creates leverage when it is applied to bottlenecks. Before you buy a single tool, you need a brutally honest operational audit.
        </Text>

        <Text style={s.h2}>Start With a Full Process Sweep</Text>
        <Text style={s.paragraph}>
          List every recurring task in each department. Rank them by time investment and money investment. Look for processes that are repetitive, rules-based, or rely on data that already exists. Those are your leverage points.
        </Text>

        <Text style={s.h2}>Where AI Delivers the Fastest Wins</Text>

        <Text style={s.h3}>Sales</Text>
        <Bullet>AI qualifies leads automatically based on behavior and fit signals</Bullet>
        <Bullet>Predicts which prospects will close based on historical patterns</Bullet>
        <Bullet>Auto-summarizes calls into CRM-ready notes and action items</Bullet>

        <Text style={s.h3}>Customer Success</Text>
        <Bullet>Automates onboarding workflows and welcome sequences</Bullet>
        <Bullet>Creates personalized follow-up sequences based on engagement</Bullet>
        <Bullet>Auto-routes support tickets by urgency and category</Bullet>

        <Text style={s.h3}>Operations</Text>
        <Bullet>Auto-generates schedules, assigns tasks, and predicts workload surges</Bullet>
        <Bullet>Inventory automation and demand forecasting</Bullet>
        <Bullet>Internal AI helpdesk answers team questions instantly</Bullet>

        <Text style={s.h3}>Finance</Text>
        <Bullet>Scan invoices, categorize expenses, chase missing receipts</Bullet>
        <Bullet>Detect anomalies or fraud patterns in real-time</Bullet>
        <Bullet>Predict cash shortages before they happen</Bullet>

        <Text style={s.h3}>HR and Recruiting</Text>
        <Bullet>Automated resume filtering and candidate scoring</Bullet>
        <Bullet>AI assistants handling interview scheduling</Bullet>
        <Bullet>Sentiment analysis on employee feedback</Bullet>

        <Text style={s.h3}>Marketing and Content</Text>
        <Bullet>AI-written ads, posts, emails, blogs, and video scripts</Bullet>
        <Bullet>Predictive targeting for highest-converting audiences</Bullet>
        <Bullet>Automated content repurposing and scheduling</Bullet>

        <View style={s.callout}>
          <Text style={s.calloutText}>
            Outcome: Walk away with 3 to 5 high-ROI opportunities where AI will instantly save time or money.
          </Text>
        </View>
      </SectionPage>

      {/* ─── Step 2: Tools and Workflow ─── */}
      <SectionPage
        step="STEP 2"
        title="Choose the Right Tools and Build the Workflow"
        goal="Integrate AI into your existing systems so it feels seamless, not chaotic."
      >
        <Text style={s.paragraph}>
          AI tools do not create leverage. Workflows do. Here is how to build them like a pro.
        </Text>

        <Text style={s.h2}>Recommended Tools by Function</Text>

        {/* Tool table */}
        <View style={s.tableHeader}>
          <Text style={{ ...s.tableHeaderCell, width: "22%" }}>Function</Text>
          <Text style={{ ...s.tableHeaderCell, width: "40%" }}>Tools</Text>
          <Text style={{ ...s.tableHeaderCell, width: "38%" }}>What It Enables</Text>
        </View>
        {[
          ["Content Creation", "Claude.ai, Copy.ai, Socialsweep.ai", "High-quality content at scale"],
          ["Automation", "n8n.io, Make.com, Zapier", "Connect systems without code"],
          ["CRM and Sales", "HubSpot, Close CRM, Atlas", "Lead scoring, auto-replies, call summaries"],
          ["Support", "Zendesk AI, Intercom, Chatbase", "24/7 FAQ bots, routing, delivery"],
          ["Analytics", "Precision.co, Frank AI", "Predictive dashboards and insights"],
          ["Voice / Video", "ElevenLabs, HeyGen", "AI voices, video generation, clipping"],
          ["Hiring / HR", "HeroHire, Trainual", "Screening and candidate communication"],
        ].map(([fn, tools, enables], i) => (
          <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? "#FAFAFA" : C.white }}>
            <Text style={{ ...s.tableCell, width: "22%", fontWeight: 600 }}>{fn}</Text>
            <Text style={{ ...s.tableCell, width: "40%" }}>{tools}</Text>
            <Text style={{ ...s.tableCell, width: "38%" }}>{enables}</Text>
          </View>
        ))}

        <Text style={s.h2}>Map the Workflow</Text>
        <Text style={s.paragraph}>
          Your AI system should follow this pattern:
        </Text>

        <Card
          title="1. Trigger"
          body="A lead opts in, a customer asks a question, or a task is created."
        />
        <Card
          title="2. AI Processing"
          body="AI labels, evaluates, drafts, or routes the input automatically."
        />
        <Card
          title="3. Automation"
          body="Data moves into your CRM, Slack, or task management system."
        />
        <Card
          title="4. Human in the Loop"
          body="Your team reviews only the exceptions. AI handles 80-90% of the repetitive work."
        />

        <View style={s.callout}>
          <Text style={s.calloutText}>
            Outcome: A clean, visual workflow showing exactly where AI steps in and where humans take over.
          </Text>
        </View>
      </SectionPage>

      {/* ─── Step 3: Test and Measure ─── */}
      <SectionPage
        step="STEP 3"
        title="Test, Automate, and Measure"
        goal="Prove ROI fast and scale only what works."
      >
        <Text style={s.paragraph}>
          Most companies over-engineer. You are going to start tiny and scale up only after the data says yes.
        </Text>

        <Text style={s.h2}>1. Start With One High-Value Process</Text>
        <Text style={s.paragraph}>
          Examples: lead qualification, appointment setting, content repurposing. Document the before numbers - hours spent, monthly cost, and output quality.
        </Text>

        <Text style={s.h2}>2. Automate the Repetitive Steps</Text>
        <Text style={s.paragraph}>Example system:</Text>
        <View style={s.card}>
          <Text style={s.cardBody}>
            Lead fills form  →  AI drafts personalized email  →  CRM updates automatically  →  Slack pings sales rep
          </Text>
        </View>

        <Text style={s.h2}>3. Weekly Feedback Loops</Text>
        <Bullet>Review AI outputs for accuracy and tone</Bullet>
        <Bullet>Fix issues and improve prompts</Bullet>
        <Bullet>Tighten logic and add edge case handling</Bullet>

        <Text style={s.h2}>4. Track These Core Metrics</Text>
        <View style={s.tableHeader}>
          <Text style={{ ...s.tableHeaderCell, width: "30%" }}>Metric</Text>
          <Text style={{ ...s.tableHeaderCell, width: "70%" }}>What It Measures</Text>
        </View>
        {[
          ["Time Saved", "Hours eliminated per task per week"],
          ["Cost", "Labor cost vs. automation cost"],
          ["Output Consistency", "Percentage of outputs approved without edits"],
          ["ROI", "(Savings + Revenue Lift - AI Cost) / AI Cost"],
        ].map(([metric, measures], i) => (
          <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? "#FAFAFA" : C.white }}>
            <Text style={{ ...s.tableCell, width: "30%", fontWeight: 600 }}>{metric}</Text>
            <Text style={{ ...s.tableCell, width: "70%" }}>{measures}</Text>
          </View>
        ))}

        <Text style={s.h2}>5. Scale What Works</Text>
        <Text style={s.paragraph}>
          Once a workflow proves ROI, replicate it in other departments. Do not scale anything that has not proven itself first.
        </Text>

        <View style={s.callout}>
          <Text style={s.calloutText}>
            Outcome: A battle-tested AI system that runs reliably, improves over time, and prints operational efficiency.
          </Text>
        </View>
      </SectionPage>

      {/* ─── Step 4: Scale ─── */}
      <SectionPage
        step="STEP 4"
        title="Scale Your AI Deployment"
        goal="Turn AI from a tool into a company-wide operating system."
      >
        <Text style={s.paragraph}>
          This is how you go from "we are trying AI" to "we are an AI-driven company."
        </Text>

        <Text style={s.h2}>1. Standardize the Wins</Text>
        <Text style={s.paragraph}>
          Turn successful workflows into SOPs. Document in Notion, Google Drive, or your project management tool. This makes AI scalable and repeatable.
        </Text>

        <Text style={s.h2}>2. Build a Team That Thinks in Automations</Text>
        <Bullet>Run monthly AI show-and-tell sessions to share wins</Bullet>
        <Bullet>Assign an AI Champion in each department</Bullet>
        <Bullet>Encourage bottom-up automation ideas from your team</Bullet>

        <Text style={s.h2}>3. Measure Quarterly Gains and Reinvest</Text>
        <Text style={s.paragraph}>
          Track savings, output gains, and speed improvements every quarter. Then reinvest those gains into more AI automation. AI is a flywheel - keep feeding it.
        </Text>

        <View style={s.callout}>
          <Text style={s.calloutText}>
            This is exactly what AIMS does for our clients. We audit, deploy, measure, and scale AI across your entire operation - so you get the results without the learning curve.
          </Text>
        </View>

        <View style={s.ctaBox}>
          <Text style={s.ctaTitle}>Want us to do this for you?</Text>
          <Text style={s.ctaText}>
            AIMS deploys AI infrastructure across your business{"\n"}
            so you can scale without adding headcount.
          </Text>
          <Link src="https://www.aioperatorcollective.com/get-started">
            <View style={s.ctaButton}>
              <Text style={s.ctaButtonText}>Book a Strategy Call</Text>
            </View>
          </Link>
        </View>
      </SectionPage>

      {/* ─── Master Prompt Template ─── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionStep}>PROMPT LIBRARY</Text>
          <Text style={s.sectionTitle}>Ready-to-Deploy Business Prompts</Text>
          <Text style={s.sectionGoal}>
            Start with the Master Prompt, then use RCCF format for any task.
          </Text>
        </View>

        <Text style={s.paragraph}>
          Want AI to work like a top hire in every part of your business? Start with the Master Prompt - it tells the AI exactly how to show up for you. Paste it once per chat and your voice, style, and priorities stay locked in.
        </Text>

        <Text style={s.h2}>Company Master Prompt Template</Text>
        <Text style={s.paragraph}>Paste this once per chat. Keep it at the top of your project chat.</Text>

        <View style={s.promptBox}>
          <Text style={s.promptLabel}>Master Prompt - Copy and Customize</Text>
          <Text style={s.promptText}>
            {`"Hey, here is how to show up for me every time:

My name is [NAME]. I run [COMPANY], a [BUSINESS TYPE] that sells [OFFER] to [AUDIENCE]. I am an entrepreneur and operator. I like fast, clear answers that help me act today.

Voice and style: energetic, motivational, casual. Short sentences. Punchy lines. Conversational flow. Keep it PG. Use American spelling. Use simple words. Grade 5 to 7 reading level.

Hooks: use questions to pull me in. Highlight key ideas with caps, bold, or italics. End sections on a strong line that pushes action.

Formatting: lots of line breaks. Numbered steps. Bullets. Tables when we compare options.

My priorities: grow revenue, cut waste, free up time. I value leverage, speed, and clarity. I prefer concrete examples over theory.

When you write for me: give me 3 options when choosing. Push back if my ask is weak. Offer a better path and say why.

Constraints: avoid buzzwords. Avoid vague claims. If a claim needs proof, cite a simple number or show a test to run.

QA: before you finish, do a 3-point quality check. 1) Is it simple. 2) Is it useful today. 3) Is the next step clear.

If info is missing, ask me up to 3 short questions. If you have enough to act, act. Do not stall.

Remember this style for future chats. If you are unsure, ask clarifying questions first."`}
          </Text>
        </View>

        <Text style={s.h2}>RCCF Prompt Format</Text>
        <View style={s.card}>
          <Text style={s.cardBody}>
            {`Role: [ROLE]
Context: [GOAL]. Audience: [AUDIENCE]. Inputs: [NUMBERS/LINKS]. Constraints: [RULES].
Command: [ACTION]. Give 3 options and a better path if you see one.
Format: [OUTPUT FORMAT]. End with a CTA. Run the 3-point QA.`}
          </Text>
        </View>

        <PageFooter />
      </Page>

      {/* ─── Marketing Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Marketing Prompts</Text>
        <Text style={s.paragraph}>
          Create a shared project named "Marketing" in your AI tool, paste the Master Prompt, and start using these.
        </Text>
        <PromptCard
          number={1}
          title="Short-Form Script Generator"
          role="Act as a short-form video coach."
          context="Topic is [TOPIC]. Audience is [AUDIENCE]. Desired action is [CTA]."
          command="Write 3 scripts using Point, Story, Lesson format. Open with a sharp pain, add a true story, end with 1 actionable lesson and CTA."
          format="For each script: Hook (1 line), Story (3-5 lines), Lesson (3 steps)."
        />
        <PromptCard
          number={2}
          title="YouTube Long-Form Outline"
          role="Act as a YouTube showrunner."
          context="Offer [OFFER]. Avatar [AVATAR]. Core promise [PROMISE]."
          command="Outline a 10-12 minute video with cold open hook, 3 loops, proof beats, and a soft CTA. Include b-roll ideas."
          format="Sections: Cold Open, Big Promise, Loop 1, Loop 2, Loop 3, Proof Stack, CTA, End Card."
        />
        <PromptCard
          number={3}
          title="Hook Bank from Customer Language"
          role="Act as a voice-of-customer analyst."
          context="Inputs: call notes, reviews, comments at [LINKS]."
          command="Extract 25 hooks in the customer's own words. Tag each hook to a pain or desire."
          format="Table with Hook, Pain/Desire, Source link, Use cases (Short, Email, Ad)."
        />
        <PromptCard
          number={4}
          title="Ad Angles and Variations"
          role="Act as a media buyer."
          context="Platform [META or YOUTUBE]. Audience [AUDIENCE]. Budget [BUDGET]."
          command="Create 10 angles. Each angle includes 3 copy lines and 1 visual idea. Keep claims grounded in proof."
          format="Table: Angle name, Lines (1-2 sentences each), Visual idea, Proof note."
        />
        <PromptCard
          number={5}
          title="Newsletter Builder"
          role="Act as a newsletter editor."
          context="List size [SIZE]. Topic [TOPIC]. Offer [OFFER]. Voice [TONE]."
          command="Write a concise email using a personal story, one lesson, one CTA."
          format="Subject, Preview, Body (Story, Lesson, CTA link)."
        />
        <PageFooter />
      </Page>

      {/* ─── Sales Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Sales Prompts</Text>
        <Text style={s.paragraph}>
          Create a shared project named "Sales" in your AI tool, paste the Master Prompt, and start using these.
        </Text>
        <PromptCard
          number={1}
          title="Speed-to-Lead Callback Script"
          role="Act as a sales responder."
          context="Offer [OFFER]. ICP [ICP]. Qual rules [QUAL_RULES]."
          command="Write a fast callback script that confirms need, qualifies lightly, and sets the next step."
          format="Open (10s), Qual (3 points), Close (next step + time), Notes (CRM fields)."
        />
        <PromptCard
          number={2}
          title="Sell-By-Chat DM Starters"
          role="Act as a social seller."
          context="Platform [INSTAGRAM/LINKEDIN]. Audience [AUDIENCE]. Proof [PROOF_LINKS]."
          command="Write 10 human DM openers that invite a reply without pressure. Include light personalization tokens."
          format="Bullets with Token, Opener, Follow-up nudge, 'If no reply' line."
        />
        <PromptCard
          number={3}
          title="Discovery Call Prep"
          role="Act as a sales coach."
          context="Prospect [NAME], company [COMPANY], pains [PAINS], desired outcome [OUTCOME]."
          command="Draft a short discovery plan that confirms goals, budget fit, and decision process."
          format="2-min opener, 5 discovery questions, success criteria, red-flag checklist."
        />
        <PromptCard
          number={4}
          title="Objection Handling Playbook"
          role="Act as an objection-handling strategist."
          context="Segment [SEGMENT]. Common objection [OBJECTION]. Proof [PROOF]."
          command="Create 3 talk tracks using different frames (data, story, future-pace) that stay empathetic and honest."
          format="Track name, When to use, Script (4-6 lines), Optional proof."
        />
        <PageFooter />
      </Page>

      {/* ─── Customer Success Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Customer Success Prompts</Text>
        <PromptCard
          number={1}
          title="Day-0 Quick-Start Plan"
          role="Act as an onboarding lead."
          context="Account [ACCOUNT]. Goal [VALUE]. Deadline [DATE]. Tier [TIER]."
          command="Build a simple plan that gets one meaningful win in week one."
          format="Checklist (3-5 steps), Owners, Acceptance criteria, Welcome note."
        />
        <PromptCard
          number={2}
          title="Risk Radar"
          role="Act as a retention analyst."
          context="Usage [USAGE SIGNALS], tickets [TICKETS], sentiment [NOTES]."
          command="Score risk and propose save plays that are specific and time-bound."
          format="Table with Risk level, Signal, Save play, Owner, Due date."
        />
        <PromptCard
          number={3}
          title="QBR Outline"
          role="Act as a CSM."
          context="Account [ACCOUNT]. Last 90-day outcomes [METRICS]. Upcoming goals [GOALS]."
          command="Draft a QBR flow that highlights wins, insights, and a 90-day plan."
          format="Sections: Wins, Insights, Roadmap, Asks, Next steps."
        />
        <PromptCard
          number={4}
          title="Expansion Moment Script"
          role="Act as a success-led seller."
          context="Milestone hit [MILESTONE]. Relevant offer [UPSELL]."
          command="Create a brief outreach that anchors on earned results and proposes a next step."
          format="3-line message + calendar link line."
        />
        <PageFooter />
      </Page>

      {/* ─── Product Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Product Prompts</Text>
        <PromptCard
          number={1}
          title="Opportunity Ranking"
          role="Act as a product strategist."
          context="Candidate ideas [LIST]. Constraints [RESOURCES]. Strategy [OKRs]."
          command="Rank opportunities by impact, confidence, and effort with a one-line rationale."
          format="Table: Idea, Impact, Confidence, Effort, Rationale."
        />
        <PromptCard
          number={2}
          title="One-Page Product Spec"
          role="Act as a product manager."
          context="Problem [PROBLEM]. Users [USERS]. Success metric [METRIC]."
          command="Write a one-page spec that is problem-first and minimal."
          format="Problem, Users, Scope, User stories, Acceptance, Risks, Success metric."
        />
        <PromptCard
          number={3}
          title="Experiment Design"
          role="Act as a growth PM."
          context="Hypothesis [HYPOTHESIS], sample [SEGMENT], constraint [BUDGET/TIME]."
          command="Design a simple test with pass/fail and decision rule."
          format="Hypothesis, Metric, Threshold, Steps, Decision rule, Next action."
        />
        <PromptCard
          number={4}
          title="Voice-of-Customer Digest"
          role="Act as an insights analyst."
          context="Sources [CALLS/REVIEWS/TICKETS]."
          command="Summarize top 5 themes with quotes and suggested product actions."
          format="Table: Theme, Quote, Source, Action idea."
        />
        <PromptCard
          number={5}
          title="Release Notes"
          role="Act as a release editor."
          context="Feature [FEATURE]. Benefits [BENEFITS]. Affected users [SEGMENTS]."
          command="Write short notes that explain what changed and why it matters."
          format="Title, What's new, Why it matters, How to use it, Links."
        />
        <PageFooter />
      </Page>

      {/* ─── Engineering Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Engineering Prompts</Text>
        <PromptCard
          number={1}
          title="PR Review Summary"
          role="Act as a senior reviewer."
          context="Repo [REPO]. Stack [STACK]. PR title [TITLE]. Diff notes [NOTES]."
          command="Produce a concise review that surfaces risks, tests to add, and merge readiness."
          format="Risks, Suggestions, Tests, Merge checklist."
        />
        <PromptCard
          number={2}
          title="Bug Triage"
          role="Act as a triage lead."
          context="Steps to reproduce [STEPS], expected [EXPECTED], actual [ACTUAL], severity [SEV]."
          command="Draft reproducible steps, likely root causes, and a minimal fix plan."
          format="Repro, Suspects, Fix plan, Acceptance test."
        />
        <PromptCard
          number={3}
          title="Doc Update"
          role="Act as a docs scribe."
          context="Feature [FEATURE], entry points [FILES/LINKS]."
          command="Update README/guide with setup, usage, and examples."
          format="Section headings with short instructions and example blocks."
        />
        <PromptCard
          number={4}
          title="Test Plan Scaffold"
          role="Act as a QA lead."
          context="Component [COMPONENT], behavior [BEHAVIOR], edge cases [EDGES]."
          command="Outline a pragmatic test plan that prevents regressions."
          format="Unit cases, Integration cases, Edge cases, Data/fixtures."
        />
        <PromptCard
          number={5}
          title="Release Checklist"
          role="Act as a release manager."
          context="Version [VERSION], envs [ENVS], CI/CD [TOOL]."
          command="Provide a pre-release checklist that is safe and fast."
          format="Pre-checks, Steps, Rollback notes, Owner."
        />
        <PageFooter />
      </Page>

      {/* ─── Operations Prompts ─── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Operations and Finance Prompts</Text>
        <PromptCard
          number={1}
          title="Weekly KPI Pack"
          role="Act as an operator-analyst."
          context="Sources [CRM/ADS/BILLING]. Targets [TARGETS]."
          command="Create a one-page scorecard with trends and red flags."
          format="Table: KPI, Current, Trend, Target, Note, Action."
        />
        <PromptCard
          number={2}
          title="Month-End Close Checklist"
          role="Act as a finance ops lead."
          context="Accounts [ACCOUNTS], deadlines [DATES], tool [ACCOUNTING_TOOL]."
          command="Draft a close checklist with dependencies and controls."
          format="Steps, Owner, Due date, Control, Evidence link."
        />
        <PromptCard
          number={3}
          title="Daily Cash and Anomalies"
          role="Act as a finance sentinel."
          context="Data [BANKS/STRIPE], thresholds [ALERT_RULES]."
          command="Generate a daily summary with anomalies and a simple next action."
          format="Cash by account, In/Out, Anomalies, Action."
        />

        <View style={s.divider} />

        {/* Final CTA */}
        <View style={s.ctaBox}>
          <Text style={s.ctaTitle}>Ready to Deploy AI Today?</Text>
          <Text style={s.ctaText}>
            Pick one department. Paste the Master Prompt.{"\n"}
            Run one RCCF prompt. Ship one asset today.{"\n\n"}
            Want AIMS to handle the heavy lifting?{"\n"}
            We deploy AI infrastructure so you can focus on growth.
          </Text>
          <Link src="https://www.aioperatorcollective.com/get-started">
            <View style={s.ctaButton}>
              <Text style={s.ctaButtonText}>Get Started with AIMS</Text>
            </View>
          </Link>
        </View>

        <PageFooter />
      </Page>
    </Document>
  )
}
