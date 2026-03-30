import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn, divider } from "./index"

const FROM_EMAIL = "AIMS <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

function recommendationBlock(title: string, description: string) {
  return `
    <div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin:0 0 12px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.6;">${description}</p>
    </div>
  `
}

// ─── AI Readiness Quiz Results ──────────────────────────────────────────────

export async function sendQuizResultsEmail(params: {
  to: string
  name: string
  score: number | undefined
  resultsUrl: string
  data: Record<string, unknown>
}) {
  const score = params.score ?? 50
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/get-started`
  const level = score < 40 ? "Early Stage" : score < 70 ? "Growing" : "Advanced"

  const recommendations = getQuizRecommendations(score)

  const safeName = escapeHtml(params.name)
  const body = `
    ${h1(`${safeName ? `${safeName}, your` : "Your"} AI Readiness Score: ${score}/100`)}
    <div style="background:#FEF2F2;border-left:4px solid #C4972A;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">AI Readiness Level</p>
      <p style="margin:0;font-size:42px;font-weight:800;color:#111827;line-height:1;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
      <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:#6B7280;">${level}</p>
    </div>
    ${p("Based on your responses, we identified three key areas where AI can accelerate your business growth:")}

    ${recommendations.map((r) => recommendationBlock(r.title, r.description)).join("")}

    ${divider()}
    ${p("Your full results page has a detailed breakdown of every category we assessed, with specific next steps for each one.")}
    ${btn("View Full Results", params.resultsUrl)}
    ${divider()}
    ${p("Want a hands-on walkthrough of your results? Our team will map specific AIMS services to your gaps - no pitch, just a working session.")}
    <a href="${strategyUrl}" style="font-size:14px;color:#C4972A;font-weight:600;text-decoration:none;">
      Book a free strategy call
    </a>
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Your AI Readiness Score: ${score}/100 - Recommendations Inside`,
    html: emailLayout(body, `You scored ${score}/100 on the AI Readiness Quiz. Here are your top recommendations.`),
    serviceArm: "lead-magnet",
  })
}

function getQuizRecommendations(score: number): Array<{ title: string; description: string }> {
  if (score < 40) {
    return [
      {
        title: "1. Start with your website - it is your 24/7 sales engine",
        description: "Your web presence likely needs a modern overhaul. An AI-powered website with CRM chatbot (Wild Ducks) captures leads while you sleep. Most businesses at your level see a 3x increase in inbound leads within 60 days.",
      },
      {
        title: "2. Automate your repetitive tasks first",
        description: "Before anything complex, identify the 5-10 tasks your team does every day that follow a pattern. Document processing, email follow-ups, data entry - these are easy AI wins that free up 10+ hours per week immediately.",
      },
      {
        title: "3. Build an AI-ready data foundation",
        description: "AI is only as good as the data it works with. Consolidate your customer data, sales records, and operations metrics into a single system. This becomes the foundation everything else builds on.",
      },
    ]
  }
  if (score < 70) {
    return [
      {
        title: "1. Layer AI-powered content and SEO onto your existing marketing",
        description: "You have a foundation in place. Now amplify it. AI-driven content production paired with SEO optimization (Money Page) can double your organic traffic in 90 days without adding headcount.",
      },
      {
        title: "2. Implement AI-powered outbound at scale",
        description: "Your sales process is ready for AI acceleration. Cold outbound with AI personalization reaches 10x more prospects with messaging that adapts to each recipient. The pipeline impact is immediate.",
      },
      {
        title: "3. Connect your systems with intelligent automation",
        description: "The biggest efficiency gain at your stage is connecting the tools you already use. RevOps pipeline automation eliminates the manual handoffs between marketing, sales, and delivery that slow your team down.",
      },
    ]
  }
  return [
    {
      title: "1. Deploy AI agents for complex business functions",
      description: "You are ready for advanced AI. Voice agents for customer support, AI-driven audience targeting, and automated financial operations can replace entire vendor contracts at a fraction of the cost.",
    },
    {
      title: "2. Build a competitive moat with AI-native processes",
      description: "At your level, the opportunity is not just efficiency - it is building processes that competitors cannot replicate without AI. Custom AI workflows tailored to your industry create lasting competitive advantage.",
    },
    {
      title: "3. Scale without scaling headcount",
      description: "You have proven the model. Now multiply it. AI handles the operational load while your team focuses on strategy, relationships, and growth. The businesses that scale fastest are the ones that scale with AI, not people.",
    },
  ]
}

// ─── ROI Calculator Results ─────────────────────────────────────────────────

export async function sendCalculatorResultsEmail(params: {
  to: string
  name: string
  resultsUrl: string
  data: Record<string, unknown>
  results: Record<string, unknown> | undefined
}) {
  const monthlySavings = (params.results?.monthlySavings as number) ?? 0
  const annualSavings = monthlySavings * 12
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/get-started`

  const safeName = escapeHtml(params.name)
  const body = `
    ${h1(`${safeName ? `${safeName}, your` : "Your"} Custom ROI Report`)}
    ${monthlySavings > 0 ? `
    <div style="background:#FEF2F2;border-left:4px solid #C4972A;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Projected Monthly Savings</p>
      <p style="margin:0;font-size:42px;font-weight:800;color:#111827;line-height:1;">$${monthlySavings.toLocaleString()}<span style="font-size:16px;color:#6B7280;">/mo</span></p>
      <p style="margin:8px 0 0;font-size:14px;color:#6B7280;">That is <strong style="color:#111827;">$${annualSavings.toLocaleString()}</strong> per year in recoverable value</p>
    </div>
    ` : ""}
    ${p("Based on your inputs, here are three high-impact recommendations for maximizing your AI ROI:")}

    ${recommendationBlock(
      "1. Target your biggest manual cost center first",
      "Every business has one function that consumes disproportionate time and budget. Whether it is content production, lead qualification, or customer support - automating that single function typically delivers 60-70% of your total savings potential."
    )}
    ${recommendationBlock(
      "2. Replace vendor spend with managed AI services",
      "Most businesses pay multiple vendors for tasks that a single AI-managed service handles better. Audit your current vendor stack against what AIMS can consolidate. Clients typically eliminate 2-4 vendor contracts in the first quarter."
    )}
    ${recommendationBlock(
      "3. Reinvest savings into growth, not more tools",
      "The real ROI is not just cost savings - it is what you do with the freed-up budget and time. The highest-performing AIMS clients take their savings and redirect them into revenue-generating activities like outbound sales and content marketing."
    )}

    ${divider()}
    ${p("Your full ROI report includes a detailed breakdown by category with specific dollar amounts for each opportunity area.")}
    ${btn("View Full ROI Report", params.resultsUrl)}
    ${divider()}
    ${p("Want to validate these numbers with real benchmarks from similar businesses? Our team can rebuild this model live with you in 20 minutes.")}
    <a href="${strategyUrl}" style="font-size:14px;color:#C4972A;font-weight:600;text-decoration:none;">
      Book a free ROI session
    </a>
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: monthlySavings > 0
      ? `Your ROI Report: $${monthlySavings.toLocaleString()}/mo in potential savings`
      : "Your Custom AI ROI Report from AIMS",
    html: emailLayout(body, monthlySavings > 0
      ? `You could save $${monthlySavings.toLocaleString()}/mo with AI automation.`
      : "Your personalized ROI report is ready to view."),
    serviceArm: "lead-magnet",
  })
}

// ─── Website Audit Results ──────────────────────────────────────────────────

export async function sendAuditResultsEmail(params: {
  to: string
  name: string
  score: number | undefined
  resultsUrl: string
  data: Record<string, unknown>
  results: Record<string, unknown> | undefined
}) {
  const score = params.score ?? 50
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/get-started`
  const marketplaceUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/marketplace`

  const severity = score < 40 ? "Critical" : score < 65 ? "Moderate" : "Good"
  const recommendations = getAuditRecommendations(score)

  const safeName = escapeHtml(params.name)
  const body = `
    ${h1(`${safeName ? `${safeName}, your` : "Your"} Website Audit Results`)}
    <div style="background:#FEF2F2;border-left:4px solid ${score < 40 ? "#EF4444" : score < 65 ? "#F59E0B" : "#22C55E"};border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${score < 40 ? "#EF4444" : score < 65 ? "#F59E0B" : "#22C55E"};text-transform:uppercase;letter-spacing:0.08em;">Website Health: ${severity}</p>
      <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
    </div>
    ${p("We analyzed your website across SEO, performance, content quality, and AI search readiness. Here are your top three priorities:")}

    ${recommendations.map((r) => recommendationBlock(r.title, r.description)).join("")}

    ${divider()}
    ${p("Your full audit report includes a detailed category-by-category breakdown with specific fixes prioritized by impact.")}
    ${btn("View Full Audit Report", params.resultsUrl)}
    ${divider()}
    ${p(`We can fix every issue on your report starting at $97/mo - fully managed, no contracts. Or book a strategy call and we will walk through the fixes together.`)}
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-right:12px;">
          ${btn("See Fix-It Plans", marketplaceUrl)}
        </td>
        <td>
          <a href="${strategyUrl}" style="font-size:14px;color:#C4972A;font-weight:600;text-decoration:none;">
            Book a strategy call
          </a>
        </td>
      </tr>
    </table>
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Your Website Scored ${score}/100 - ${recommendations.length} Priority Fixes Inside`,
    html: emailLayout(body, `Your website scored ${score}/100. Here are the fixes that matter most.`),
    serviceArm: "lead-magnet",
  })
}

// ─── Business Credit Score Results ─────────────────────────────────────────

export async function sendCreditScoreEmail({
  to,
  name,
  score,
  resultsUrl,
}: {
  to: string
  name?: string
  score?: number
  resultsUrl: string
}) {
  const displayName = name || "there"
  const s = score ?? 50

  const tier = s < 40 ? "Credit Builder" : s < 60 ? "Developing" : s < 80 ? "Established" : "Strong"

  const recommendations =
    s < 40
      ? [
          recommendationBlock("Register a Formal Business Entity", "If you're operating as a sole prop, register as an LLC or S-Corp immediately. This is the foundation everything else is built on."),
          recommendationBlock("Get Your EIN and Open a Business Bank Account", "Apply for a free EIN at IRS.gov (takes 10 minutes), then open a dedicated business checking account this week."),
          recommendationBlock("Set Up Net-30 Accounts That Report to Bureaus", "Uline, Quill, and Grainger all offer net-30 terms and report to D&B. These are the fastest way to start building your business credit file."),
        ]
      : s < 80
      ? [
          recommendationBlock("Add More Tradelines Reporting to Bureaus", "The more accounts actively reporting payment history, the stronger your profile. Target 5+ accounts across D&B, Experian Business, and Equifax Business."),
          recommendationBlock("Keep Utilization Under 30% on Every Account", "Business credit scoring heavily penalizes high utilization. Set up alerts to keep every account below 30%."),
          recommendationBlock("Apply for a Business Credit Card or Line of Credit", "A dedicated business credit card used and paid in full monthly dramatically accelerates your score growth."),
        ]
      : [
          recommendationBlock("Apply for Premium Business Credit Lines", "With a strong profile, you now qualify for American Express Business, Chase Ink, and SBA-backed credit lines at favorable rates."),
          recommendationBlock("Leverage Your Credit Score for Vendor Negotiations", "Use your strong profile to negotiate net-60/net-90 terms with key suppliers — this directly improves cash flow."),
          recommendationBlock("Separate Personal Guarantees Using Business Credit", "A strong business credit score lets you remove personal guarantees from business financing — protecting your personal assets."),
        ]

  const html = emailLayout(`
    ${h1(`Your Business Credit Score: ${s}/100`)}
    ${p(`Hi ${displayName},`)}
    ${p(`You just completed your Business Credit Score assessment. Here's what your results mean and what to do next.`)}
    <div style="background:#1a1a2e;border:2px solid #C4972A;border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
      <div style="font-size:64px;font-weight:900;color:#C4972A;line-height:1;">${s}</div>
      <div style="font-size:18px;color:#F0EBE0;font-weight:600;margin-top:4px;">out of 100</div>
      <div style="display:inline-block;margin-top:12px;padding:4px 16px;border-radius:9999px;border:1px solid #C4972A;color:#C4972A;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${tier}</div>
    </div>
    ${p(`Based on your answers across business foundation, credit profile, tradeline reporting, credit utilization, and business maturity — here are your three highest-impact next steps:`)}
    ${recommendations.join("")}
    ${divider()}
    ${btn("View Your Full Scorecard", resultsUrl)}
    ${p(`Your full scorecard includes a dimension-by-dimension breakdown, the specific factors helping and hurting your score, and a complete 90-day action plan.`)}
    ${divider()}
    ${p(`Want help executing your credit building plan? Book a free strategy call with the AIMS team.`)}
    ${btn("Book Free Strategy Call", "https://aimseos.com/get-started")}
  `)

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO,
    subject: `Your Business Credit Score: ${s}/100 — Here's Your Action Plan`,
    html,
    serviceArm: "lead-magnet",
  })
}

// ─── Executive Ops Audit Results ───────────────────────────────────────────

export async function sendOpsAuditEmail({
  to,
  name,
  score,
  resultsUrl,
  data,
}: {
  to: string
  name?: string
  score?: number
  resultsUrl: string
  data?: Record<string, unknown>
}) {
  const displayName = name || "there"
  const s = score ?? 50
  const scores = data?.scores as { costOfInefficiency?: number; aiRoiPotential?: number } | undefined
  const cost = scores?.costOfInefficiency ?? 0
  const roi = scores?.aiRoiPotential ?? 0

  const tier = s < 40 ? "Optimization Target" : s < 70 ? "Growth Ready" : "High Performer"

  const recs = s < 40
    ? [
        recommendationBlock("Full Operations Transformation", "Your audit identified multiple high-friction bottlenecks. AIMS recommends a full ops transformation starting with your highest-cost department."),
        recommendationBlock("Cold Outbound + CRM Automation", "Manual sales processes are costing you significantly. AI-powered outbound sequences and CRM automation should be your first deployment."),
        recommendationBlock("Process Elimination Before Optimization", "Several of your identified processes should be eliminated entirely before being optimized. Our ops team will identify which ones in your strategy session."),
      ]
    : s < 70
    ? [
        recommendationBlock("Targeted Department Automation", "Your audit shows strong performance in some areas with clear automation gaps in others. Targeted deployment in your lowest-scoring departments will yield the fastest ROI."),
        recommendationBlock("Workflow Integration Audit", "With your current tool stack, integration gaps are likely creating data silos and duplicate work. A workflow audit will identify consolidation opportunities."),
        recommendationBlock("AI Agent Deployment", "Based on your identified AI agent placement, you're already thinking about the right problems. AIMS can have your first agent deployed within 30 days."),
      ]
    : [
        recommendationBlock("Scale Without Hiring", "Your efficiency score shows a well-run operation. The next phase is scaling your output without scaling headcount — AI automation makes this possible."),
        recommendationBlock("Executive Intelligence Dashboard", "At your efficiency level, real-time visibility is the highest-value next investment. Automated reporting and KPI dashboards give you the data you need without the overhead."),
        recommendationBlock("Advanced AI Agent Suite", "You're ready for custom AI agent deployments that go beyond off-the-shelf automation. AIMS builds bespoke AI workflows for businesses at your stage."),
      ]

  const costLine = cost > 0
    ? `<div style="background:#1a0a0a;border:1px solid #ef4444;border-radius:12px;padding:20px;text-align:center;margin:16px 0;"><div style="font-size:13px;color:#ef4444;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Estimated Annual Cost of Inefficiency</div><div style="font-size:42px;font-weight:900;color:#ef4444;">$${cost.toLocaleString()}</div></div>`
    : ""

  const roiLine = roi > 0
    ? `<div style="background:#0a1a0a;border:1px solid #22c55e;border-radius:12px;padding:20px;text-align:center;margin:16px 0;"><div style="font-size:13px;color:#22c55e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Projected AI ROI Potential</div><div style="font-size:42px;font-weight:900;color:#22c55e;">$${roi.toLocaleString()}/yr</div></div>`
    : ""

  const html = emailLayout(`
    ${h1(`Your Executive Operations Audit: ${s}/100`)}
    ${p(`Hi ${displayName},`)}
    ${p(`Your Executive Operations Audit is complete. Here's your summary — and what to do with it.`)}
    <div style="background:#1a1a2e;border:2px solid #C4972A;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
      <div style="font-size:56px;font-weight:900;color:#C4972A;line-height:1;">${s}</div>
      <div style="font-size:16px;color:#F0EBE0;margin-top:4px;">Operational Efficiency Score</div>
      <div style="display:inline-block;margin-top:12px;padding:4px 16px;border-radius:9999px;border:1px solid #C4972A;color:#C4972A;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${tier}</div>
    </div>
    ${costLine}
    ${roiLine}
    ${p(`Based on your department analysis, bottleneck inputs, and cost structure — here are your three highest-impact next steps:`)}
    ${recs.join("")}
    ${divider()}
    ${btn("View Your Full Executive Scorecard", resultsUrl)}
    ${p(`Your full scorecard includes department-by-department efficiency scores, your complete pain point analysis, and a prioritized 5-step automation roadmap.`)}
    ${divider()}
    ${p(`Ready to turn this audit into a 90-day action plan? Book a free Executive Strategy Session.`)}
    ${btn("Book Executive Strategy Session", "https://aimseos.com/get-started")}
  `)

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO,
    subject: `Your Executive Ops Audit: ${s}/100 — $${cost > 0 ? cost.toLocaleString() : "X"} in Annual Inefficiency Identified`,
    html,
    serviceArm: "lead-magnet",
  })
}

function getAuditRecommendations(score: number): Array<{ title: string; description: string }> {
  if (score < 40) {
    return [
      {
        title: "1. Fix critical page speed issues (high impact)",
        description: "Your site likely loads too slowly for both users and search engines. Google penalizes slow sites in rankings, and visitors bounce after 3 seconds. Compressing images, enabling browser caching, and optimizing your code can cut load times by 50% or more.",
      },
      {
        title: "2. Repair broken SEO fundamentals",
        description: "Missing meta titles, broken links, and poor heading structure are costing you search visibility right now. These are quick fixes that compound over time - every day without them is traffic you are losing to competitors who have them in place.",
      },
      {
        title: "3. Add AI search visibility signals",
        description: "AI-powered search engines like Perplexity and Google SGE are reshaping how people find businesses. Without structured data, clear authority signals, and AI-optimized content, your business is invisible to the fastest-growing search channel.",
      },
    ]
  }
  if (score < 65) {
    return [
      {
        title: "1. Strengthen your content depth and topical authority",
        description: "Your site has the basics but lacks the depth that earns top rankings. Building comprehensive content clusters around your core topics tells search engines you are the authority - not just another page competing for the same keywords.",
      },
      {
        title: "2. Optimize for conversion, not just traffic",
        description: "Getting visitors is only half the equation. Your site may be leaking conversions through unclear CTAs, missing social proof, or a checkout flow that creates friction. Small conversion rate improvements can double your revenue from existing traffic.",
      },
      {
        title: "3. Build backlink authority systematically",
        description: "Your domain authority determines how competitive you are for high-value keywords. A managed link-building strategy focused on relevant, high-authority sites can move you from page 3 to page 1 for your most valuable search terms.",
      },
    ]
  }
  return [
    {
      title: "1. Dominate AI-powered search results",
      description: "Your site is in good shape for traditional search. The next frontier is AI search engines - Perplexity, ChatGPT search, Google AI Overviews. Optimizing your content structure and authority signals for AI recommendation can capture early-mover advantage.",
    },
    {
      title: "2. Expand your conversion infrastructure",
      description: "At your level, marginal improvements compound significantly. A/B testing your top landing pages, adding AI-powered chat, and implementing personalized CTAs can increase conversion rates by 20-40% without any new traffic.",
    },
    {
      title: "3. Build a content flywheel",
      description: "High-scoring sites grow fastest when they systematize content production. AI-managed content creation paired with programmatic SEO can 10x your indexed pages while maintaining quality - turning your site into a compounding asset.",
    },
  ]
}
