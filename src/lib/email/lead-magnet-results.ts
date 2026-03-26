import { sendTrackedEmail } from "./index"

const FROM_EMAIL = "AIMS <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

function emailLayout(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AIMS</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:1px solid #F0F0F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="https://aimseos.com/logo.png" alt="AIMS" width="36" height="36"
                      style="display:inline-block;vertical-align:middle;margin-right:10px;" />
                    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;letter-spacing:-0.5px;">AIMS</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#9CA3AF;letter-spacing:0.05em;text-transform:uppercase;">Your Results</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;border-radius:0 0 12px 12px;padding:24px 40px;border-top:1px solid #F0F0F0;">
              <p style="margin:0 0 8px;font-size:12px;color:#6B7280;">
                Questions? Reply to this email or reach us at
                <a href="mailto:${REPLY_TO}" style="color:#C4972A;text-decoration:none;">${REPLY_TO}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                AIMS - AI-Powered Business Infrastructure -
                <a href="https://aimseos.com" style="color:#9CA3AF;text-decoration:none;">aimseos.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#C4972A;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;margin:8px 0;">${text}</a>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.5px;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4B5563;line-height:1.7;">${text}</p>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #F0F0F0;margin:28px 0;" />`
}

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

  const body = `
    ${h1(`${params.name ? `${params.name}, your` : "Your"} AI Readiness Score: ${score}/100`)}
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

  const body = `
    ${h1(`${params.name ? `${params.name}, your` : "Your"} Custom ROI Report`)}
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

  const body = `
    ${h1(`${params.name ? `${params.name}, your` : "Your"} Website Audit Results`)}
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
