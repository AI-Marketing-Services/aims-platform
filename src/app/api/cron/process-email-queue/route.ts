import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend, sendTrackedEmail } from "@/lib/email"
import { logCronExecution } from "@/lib/cron-log"

export const maxDuration = 60

export async function GET(req: Request) {
  // Verify cron secret on production
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const pending = await db.emailQueueItem.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
      take: 50,
      orderBy: { scheduledFor: "asc" },
    })

    if (!pending.length) {
      const duration = Date.now() - startTime
      await logCronExecution("process-email-queue", "success", "No pending emails", duration)
      return NextResponse.json({ processed: 0 })
    }

    let sent = 0
    let failed = 0

    for (const item of pending) {
      try {
        // If recipient has an active subscription, cancel nurture sequences (they converted)
        const user = await db.user.findFirst({
          where: { email: item.recipientEmail },
          include: { subscriptions: { where: { status: "ACTIVE" }, take: 1 } },
        })

        const nurtureSequences = ["post-quiz", "post-calculator", "post-audit"]
        if (user?.subscriptions.length && nurtureSequences.includes(item.sequenceKey)) {
          await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "cancelled" } })
          continue
        }

        const emailContent = buildEmailContent(item.sequenceKey, item.emailIndex, item.metadata as Record<string, unknown>)
        if (!emailContent) {
          await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "cancelled" } })
          continue
        }

        await sendTrackedEmail({
          from: "AIMS <hello@aimseos.com>",
          to: item.recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        })

        await db.emailQueueItem.update({
          where: { id: item.id },
          data: { status: "sent", sentAt: new Date() },
        })
        sent++
      } catch (err) {
        console.error(`Failed to send email queue item ${item.id}:`, err)
        await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "failed" } })
        failed++
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution("process-email-queue", "success", `Processed: ${pending.length}, Sent: ${sent}, Failed: ${failed}`, duration)

    return NextResponse.json({ processed: pending.length, sent, failed })
  } catch (err) {
    const duration = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("process-email-queue", "error", errorMessage, duration)
    console.error("Process email queue cron failed:", err)
    return NextResponse.json({ error: "Process email queue failed" }, { status: 500 })
  }
}

interface EmailContent {
  subject: string
  html: string
}

function buildEmailContent(
  sequenceKey: string,
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): EmailContent | null {
  const score = metadata.score as number | undefined
  const name = (metadata.name as string) || "there"
  const monthlySavings = metadata.monthlySavings as number | undefined
  const auditScore = metadata.auditScore as number | undefined
  const serviceName = (metadata.serviceName as string) || "AIMS Service"
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/portal/dashboard`
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/get-started`

  const wrap = (content: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 16px;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#DC2626;padding:20px 32px;">
  <span style="font-size:18px;font-weight:800;color:#fff;">AIMS</span>
  <span style="float:right;font-size:11px;color:#fca5a5;text-transform:uppercase;letter-spacing:0.05em;">AI Managing Services</span>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #F0F0F0;">
  <p style="margin:0;font-size:12px;color:#9CA3AF;">AIMS · <a href="https://aimseos.com" style="color:#9CA3AF;">aimseos.com</a></p>
</td></tr>
</table></body></html>`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const marketplaceUrl = `${baseUrl}/marketplace`
  const resellerUrl = `${baseUrl}/reseller/dashboard`
  const cta = (text: string, url: string) =>
    `<a href="${url}" style="display:inline-block;background:#DC2626;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;margin:8px 0;">${text}</a>`

  // ── post-quiz sequence ──────────────────────────────────────────────────────
  if (sequenceKey === "post-quiz") {
    switch (emailIndex) {
      case 0:
        return {
          subject: `Your AI Readiness Score: ${score ?? "Ready"}/100`,
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — your AI readiness results are in</h1>
            ${score ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Your Score</p>
              <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
            </div>` : ""}
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We analyzed your inputs and identified your biggest AI growth opportunities. Your full breakdown is ready to view.</p>
            ${cta("View Full Results →", `${strategyUrl}?ref=quiz-email`)}
            <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Want to talk through your results? <a href="${strategyUrl}" style="color:#DC2626;font-weight:600;">Book a free strategy call →</a></p>
          `),
        }
      case 1:
        return {
          subject: "What a business like yours looked like before AIMS",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">From scattered to streamlined in 30 days</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — a few days ago you took our AI readiness quiz${score ? ` and scored ${score}/100` : ""}. We wanted to show you what transformation actually looks like.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">One of our clients was spending 15+ hours a week on manual tasks that AI now handles in minutes. Their team went from reactive firefighting to proactive growth — and their revenue increased 40% in the first quarter.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">The gap between where you are and where you could be is smaller than you think. It starts with identifying the right moves — which is exactly what your quiz results showed.</p>
            ${cta("See How We Can Help →", `${strategyUrl}?ref=quiz-case-study`)}
          `),
        }
      case 2:
        return {
          subject: "The product that matches your biggest gap",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">We matched your gaps to a specific solution</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — based on your quiz results${score ? ` (${score}/100)` : ""}, your biggest opportunity is in the areas where AI can replace manual work immediately.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">AIMS offers 15 specialized service arms — from AI-powered SEO and content to automated operations and customer support. We don't do one-size-fits-all. We match the exact product to your exact weakness.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Browse the marketplace and see which service fits the gaps your quiz uncovered. Most clients start with one arm and expand as they see results.</p>
            ${cta("Browse Services →", `${marketplaceUrl}?ref=quiz-product`)}
          `),
        }
      case 3:
        return {
          subject: "What's a month of inaction costing you?",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Every month you wait, the gap widens</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — it has been a week since your AI readiness assessment. In that time, businesses that have already adopted AI automation have compounded another month of efficiency gains.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">The average business wastes $3,000-$8,000/month on tasks that AI handles better, faster, and cheaper. That is not a projection — it is what we see across our client base every single month.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">A 15-minute strategy call is all it takes to see exactly where you are leaving money on the table. No pitch, no pressure — just a clear picture of your ROI.</p>
            ${cta("Book a Free Strategy Call →", `${strategyUrl}?ref=quiz-roi`)}
          `),
        }
      case 4:
        return {
          subject: "Your competitors are already doing this",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">The businesses beating you have one thing in common</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — this is not a scare tactic. It is a market reality. AI adoption in small and mid-size businesses grew 78% in the last year. The companies investing now are pulling ahead in search rankings, lead gen, and operational efficiency.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Your quiz results showed clear opportunities. The question is not whether AI will matter for your business — it already does. The question is whether you will lead the shift or play catch-up.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We can have you running AI-powered services within a week. No complex setup, no learning curve — we handle everything.</p>
            ${cta("Get Started Today →", `${strategyUrl}?ref=quiz-competitive`)}
          `),
        }
      case 5:
        return {
          subject: "Get your first month free if you start this week",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Your first month is on us</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — we have been sharing what AIMS can do for a business like yours. Now we want to make it easy to take the first step.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Sign up for any AIMS service this week and your first month is completely free. No commitment beyond that — if you do not see clear value, cancel anytime. We are that confident in the results.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">This is the last email in this series. After this, the offer goes away. If you have been on the fence, now is the time.</p>
            ${cta("Claim Your Free Month →", `${strategyUrl}?ref=quiz-offer`)}
          `),
        }
    }
  }

  // ── post-calculator sequence ────────────────────────────────────────────────
  if (sequenceKey === "post-calculator") {
    switch (emailIndex) {
      case 0:
        return {
          subject: monthlySavings ? `You could save $${monthlySavings.toLocaleString()}/month with AI` : "Your custom AI ROI report is ready",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — here's your custom ROI report</h1>
            ${monthlySavings ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Projected Monthly Savings</p>
              <p style="margin:0;font-size:42px;font-weight:800;color:#111827;line-height:1;">$${monthlySavings.toLocaleString()}<span style="font-size:16px;color:#6B7280;">/mo</span></p>
            </div>` : ""}
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Based on your inputs, we built a personalized ROI model showing exactly where AI automation pays off fastest for your business.</p>
            ${cta("View Your ROI Report →", `${strategyUrl}?ref=calc-email`)}
            <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Every month you wait costs you. <a href="${strategyUrl}" style="color:#DC2626;font-weight:600;">Let's rebuild your ROI model live →</a></p>
          `),
        }
      case 1: {
        const monthlyCost = monthlySavings ?? 3000
        const sixMonthCost = monthlyCost * 6
        return {
          subject: "The cost of waiting",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Every month you delay costs you $${monthlyCost.toLocaleString()}</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — yesterday we shared your ROI report. Here is the part most people overlook: savings are not static. They compound.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">If you wait 6 months to act, that is $${sixMonthCost.toLocaleString()} in savings you will never recover. The tasks you are paying humans to do manually right now — data entry, content production, customer follow-up — AI handles them around the clock at a fraction of the cost.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">The businesses that move first capture the margin. The ones that wait pay the tax. Which side do you want to be on?</p>
            ${cta("Stop Leaving Money on the Table →", `${strategyUrl}?ref=calc-waiting`)}
          `),
        }
      }
      case 2:
        return {
          subject: "The AIMS product that solves your biggest cost center",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">We found the service that saves you the most</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — your ROI calculator flagged specific areas where you are overspending. We matched those to an AIMS service arm that directly eliminates that waste.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">AIMS runs 15 specialized service lines — AI SEO, automated content, managed ad campaigns, operations automation, and more. Each one is built to replace an entire function that currently eats your budget.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Browse the marketplace and find the one that hits your biggest cost center first. Most clients see positive ROI within the first 30 days.</p>
            ${cta("Find Your Match →", `${marketplaceUrl}?ref=calc-product`)}
          `),
        }
      case 3: {
        const savingsDisplay = monthlySavings ? `$${monthlySavings.toLocaleString()}` : "$4,200"
        return {
          subject: `A business like yours saved ${savingsDisplay}/mo`,
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Real numbers from a real client</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — a business similar to yours came to us spending too much on manual marketing and operations. Their team was stretched thin and their growth had flatlined.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Within 60 days of launching with AIMS, they cut ${savingsDisplay}/month in operational costs, doubled their content output, and freed up their team to focus on revenue-generating work. No new hires, no complex tooling — just AIMS running in the background.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Your ROI report showed similar potential. The only difference between their results and yours is taking the first step.</p>
            ${cta("Book a Strategy Call →", `${strategyUrl}?ref=calc-case-study`)}
          `),
        }
      }
      case 4:
        return {
          subject: "We built this for a similar business last month",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Fresh off the line: a build just like yours</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — last month we onboarded a business with nearly identical needs to what your ROI calculator revealed. They were skeptical. They did not think AI could actually replace what their team was doing manually.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Two weeks in, they stopped being skeptical. Their AI-managed content pipeline was producing 3x the output. Their automated lead nurture converted 2x better than their manual follow-up. And their team finally had time to focus on closing deals instead of chasing admin work.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We are not talking about theoretical gains. This happened last month. We can do the same for you.</p>
            ${cta("See What We Can Build →", `${strategyUrl}?ref=calc-recent-win`)}
          `),
        }
      case 5:
        return {
          subject: "Let's rebuild your ROI model live together",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Let's go deeper on your numbers — together</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — this is the last email in this series, and we want to leave you with something valuable: a live, personalized ROI session with our team.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">In 20 minutes, we will rebuild your ROI model with real numbers from your business — not estimates. We will show you exactly which AIMS service generates the fastest payback and map out a 90-day plan to get there.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">No cost, no commitment. If the numbers do not make sense, we will tell you. We would rather earn your trust than push a deal.</p>
            ${cta("Book Your Live ROI Session →", `${strategyUrl}?ref=calc-book-call`)}
          `),
        }
    }
  }

  // ── post-audit sequence ─────────────────────────────────────────────────────
  if (sequenceKey === "post-audit") {
    switch (emailIndex) {
      case 0:
        return {
          subject: auditScore !== undefined ? `Your website scored ${auditScore}/100 — here are the fixes` : "Your website audit is complete — here are the fixes",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Hey ${name} — your website audit is complete</h1>
            ${auditScore !== undefined ? `<div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:20px;margin:0 0 24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Website Score</p>
              <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${auditScore}<span style="font-size:20px;color:#6B7280;">/100</span></p>
            </div>` : ""}
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">We identified the critical issues hurting your SEO, conversions, and AI search visibility. Your full audit report with prioritized fixes is ready.</p>
            ${cta("View Full Audit Report →", `${strategyUrl}?ref=audit-email`)}
            <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">We can fix everything on your report starting at $97/mo. <a href="${marketplaceUrl}" style="color:#DC2626;font-weight:600;">See how →</a></p>
          `),
        }
      case 1:
        return {
          subject: "Fix #1 from your audit",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Your top-priority fix (you can do this today)</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — we promised actionable fixes from your audit${auditScore !== undefined ? ` (score: ${auditScore}/100)` : ""}, so here is fix number one: <strong style="color:#111827;">optimize your page titles and meta descriptions.</strong></p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Most small business websites have generic or missing meta tags. This is the single fastest way to improve your search rankings without spending a dime. Make every page title unique, under 60 characters, and include your primary keyword. Meta descriptions should be under 155 characters and include a clear value proposition.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">This one fix can improve your click-through rate by 20-30%. If you want us to handle it (along with everything else on your report), we can do that too.</p>
            ${cta("See All Fixes →", `${strategyUrl}?ref=audit-fix1`)}
          `),
        }
      case 2:
        return {
          subject: "Fix #2: SEO without a team",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">You do not need an SEO team to rank</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — here is fix number two from your audit: <strong style="color:#111827;">build internal links between your pages.</strong></p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Google uses internal links to understand your site structure and distribute authority. Most business sites have pages that are orphaned — no other page links to them, so Google barely crawls them. Go through your top 10 pages and add 2-3 relevant internal links to each one. Link from high-traffic pages to the ones you want to rank.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">That said, DIY SEO only goes so far. AIMS handles technical SEO, content strategy, link building, and AI search optimization as a fully managed service — so you can focus on running your business instead of learning algorithms.</p>
            ${cta("Browse SEO Services →", `${marketplaceUrl}?ref=audit-fix2`)}
          `),
        }
      case 3:
        return {
          subject: "Before and after: a similar business",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">From page 5 to page 1 in 90 days</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — a business in a similar position to yours came to us with an audit score in the low 40s. Their site was slow, their SEO was scattered, and they were invisible on Google.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Within 90 days of AIMS managing their web presence, they moved from page 5 to page 1 for their top 8 keywords. Their organic traffic increased 215%. Their inbound leads tripled. All while their team spent zero hours on SEO.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Your audit flagged the same kinds of issues. The playbook that worked for them will work for you.</p>
            ${cta("Book a Strategy Call →", `${strategyUrl}?ref=audit-case-study`)}
          `),
        }
      case 4:
        return {
          subject: "$97/month fixes everything on your audit report",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Every issue on your report, handled for $97/mo</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — over the past week, we shared your audit results and a couple of DIY fixes. But let's be honest: fixing everything on that report manually would take dozens of hours and require expertise most business owners do not have.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">AIMS fixes every issue on your audit — technical SEO, page speed, content gaps, mobile optimization, AI search visibility — for $97/month. Fully managed. No contracts. Cancel anytime.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">This is the last email in this series. If your website matters to your business, this is the most cost-effective way to fix it.</p>
            ${cta("Get Started at $97/mo →", `${marketplaceUrl}?ref=audit-offer`)}
          `),
        }
    }
  }

  // ── post-purchase sequence ──────────────────────────────────────────────────
  if (sequenceKey === "post-purchase") {
    switch (emailIndex) {
      case 0:
        return {
          subject: `Welcome to AIMS — your ${serviceName} is being set up`,
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Welcome aboard, ${name}!</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Your <strong>${serviceName}</strong> subscription is confirmed. Here's what happens next:</p>
            <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li>Our team begins setup within <strong style="color:#111827;">24 hours</strong></li>
              <li>You'll receive a setup guide and onboarding call invite</li>
              <li>Track progress in your <a href="${portalUrl}" style="color:#DC2626;">AIMS portal</a></li>
            </ol>
            ${cta("Go to Your Portal →", portalUrl)}
            <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Questions? Reply to this email — we respond within 2 business hours.</p>
          `),
        }
      case 1:
        return {
          subject: "Your setup guide",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Here is your setup guide for ${serviceName}</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — your ${serviceName} setup is underway. Here is what to expect over the next few days:</p>
            <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li><strong style="color:#111827;">Day 1-2:</strong> Our team reviews your business details and configures your service</li>
              <li><strong style="color:#111827;">Day 3-5:</strong> Initial setup complete — you will see the first deliverables in your portal</li>
              <li><strong style="color:#111827;">Day 5-7:</strong> Optimization phase — we fine-tune based on your feedback</li>
            </ol>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">You can track every step in your AIMS portal. Log in anytime to see progress, leave feedback, or message our team directly.</p>
            ${cta("Open Your Portal →", portalUrl)}
          `),
        }
      case 2:
        return {
          subject: "Feature spotlight",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Get the most out of ${serviceName}</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — now that your ${serviceName} is being set up, we want to make sure you know about a feature most clients overlook at first: <strong style="color:#111827;">your real-time analytics dashboard.</strong></p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Inside your portal, you can see exactly what AIMS is doing for your business — deliverables completed, performance metrics, and ROI tracking. No guessing, no waiting for reports. Everything updates in real time.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Clients who actively use their dashboard see 30% better results because they give faster feedback. Take a minute to explore it today.</p>
            ${cta("Explore Your Dashboard →", portalUrl)}
          `),
        }
      case 3:
        return {
          subject: "How's everything going?",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Quick check-in: how is everything going?</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — it has been a week since you started with ${serviceName}. We want to make sure everything is meeting your expectations.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">A few things to check:</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li>Are the initial deliverables what you expected?</li>
              <li>Is there anything you would like us to adjust?</li>
              <li>Do you have any questions about your portal or reporting?</li>
            </ul>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Just reply to this email with any feedback. Our team reads every response and will action your notes within 24 hours. Your success is how we measure ours.</p>
            ${cta("View Your Progress →", portalUrl)}
          `),
        }
      case 4:
        return {
          subject: "Ready for the next level?",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Ready to add another growth lever?</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — you have been running ${serviceName} for two weeks now, and we hope you are seeing the early results come in.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Clients who layer a second AIMS service see compounding returns. For example, pairing AI SEO with AI Content creates a flywheel — better content ranks higher, higher rankings drive more traffic, more traffic generates more leads.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Take a look at which complementary service would amplify what ${serviceName} is already doing for you. Our team is happy to recommend the best pairing based on your goals.</p>
            ${cta("Explore Complementary Services →", `${marketplaceUrl}?ref=upsell`)}
          `),
        }
      case 5:
        return {
          subject: "30 days in: here's what's next",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">30 days in — let's talk about what is next</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — congratulations on your first month with AIMS. By now, ${serviceName} should be fully operational and delivering measurable results.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Log into your portal to review your 30-day performance summary. You will see exactly what AIMS has delivered, how it compares to your baseline, and where the biggest opportunities are for month two and beyond.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">If you are ready to expand, we can map out a growth plan that builds on your momentum. If you want to keep things steady, that works too — we will keep optimizing what is already running.</p>
            ${cta("Review Your 30-Day Results →", portalUrl)}
            <p style="font-size:14px;color:#6B7280;margin:24px 0 0;">Want to discuss your growth plan? <a href="${strategyUrl}" style="color:#DC2626;font-weight:600;">Book a quick call with our team →</a></p>
          `),
        }
    }
  }

  // ── partner-onboard sequence ────────────────────────────────────────────────
  if (sequenceKey === "partner-onboard") {
    switch (emailIndex) {
      case 0:
        return {
          subject: "Welcome to the AIMS Partner Program",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Welcome to the AIMS Partner Program, ${name}!</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">You're now part of a network of partners earning 20% recurring commissions on every AIMS client you refer.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;"><strong>How to close your first deal:</strong></p>
            <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li>Share your referral link with business owners in your network</li>
              <li>They book a strategy call — you earn 20% of their monthly spend</li>
              <li>Commissions paid monthly, automatically</li>
            </ol>
            ${cta("View Your Partner Dashboard →", resellerUrl)}
          `),
        }
      case 1:
        return {
          subject: "How to close your first deal",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Your playbook for closing your first AIMS deal</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — the partners who earn the most follow a simple formula. Here it is:</p>
            <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li><strong style="color:#111827;">Identify the pain:</strong> Ask business owners what is eating their time. Content creation, SEO, lead gen, and manual operations are the top four.</li>
              <li><strong style="color:#111827;">Share the tool:</strong> Send them to our AI readiness quiz or ROI calculator. Let the results do the selling.</li>
              <li><strong style="color:#111827;">Introduce AIMS:</strong> Once they see the gap, position AIMS as the team that fills it — fully managed, no hiring required.</li>
            </ol>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">You do not need to be technical. You do not need to sell hard. Just connect the right people with the right solution and earn 20% recurring on every dollar they spend.</p>
            ${cta("Get Your Referral Link →", resellerUrl)}
          `),
        }
      case 2:
        return {
          subject: "Your partner landing page is live",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Your personalized referral page is ready</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — your partner landing page is now live. This is a custom page tied to your referral code that tracks every lead you send our way.</p>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Here is how to use it:</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li>Share it directly with prospects via email, text, or social media</li>
              <li>Add it to your email signature for passive referrals</li>
              <li>Include it in any content you create about business growth or AI</li>
            </ul>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Every visitor who signs up through your page is automatically attributed to you. No manual tracking, no missed commissions.</p>
            ${cta("View Your Landing Page →", resellerUrl)}
          `),
        }
      case 3:
        return {
          subject: "Your referral tracking dashboard",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Track every referral, click, and commission</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — your partner dashboard gives you full visibility into your referral pipeline. Here is what you can track:</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li><strong style="color:#111827;">Link clicks:</strong> See how many people visited your referral page</li>
              <li><strong style="color:#111827;">Signups:</strong> Track who created an account through your link</li>
              <li><strong style="color:#111827;">Conversions:</strong> See which signups became paying clients</li>
              <li><strong style="color:#111827;">Commissions:</strong> Your earned and pending payouts, updated in real time</li>
            </ul>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">The dashboard updates automatically. No spreadsheets, no guessing. Log in and see exactly how your referral efforts are paying off.</p>
            ${cta("Open Your Dashboard →", resellerUrl)}
          `),
        }
      case 4:
        return {
          subject: "How partners are selling AIMS",
          html: wrap(`
            <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">What top-performing partners do differently</h1>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Hey ${name} — after two weeks in the program, we wanted to share what our highest-earning partners have in common:</p>
            <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
              <li><strong style="color:#111827;">They lead with value:</strong> They share the free tools (quiz, calculator, audit) first. The tools build trust and qualify the prospect automatically.</li>
              <li><strong style="color:#111827;">They focus on a niche:</strong> The best partners pick one industry they know well and position AIMS as the answer to that industry's specific pain.</li>
              <li><strong style="color:#111827;">They follow up:</strong> A simple "did you check out that tool I sent?" message converts more referrals than any pitch ever could.</li>
            </ol>
            <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">You have all the tools. You have the commission structure. Now it is about consistent outreach. Even 2-3 conversations a week can build a meaningful income stream.</p>
            ${cta("View Your Partner Tools →", resellerUrl)}
          `),
        }
    }
  }

  return null
}
