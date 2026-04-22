export interface PlaybookUseCase {
  id: string
  title: string
  problem: string
  solution: string
  tools: string[]
  monthlyValue: string
  difficulty: "Easy" | "Medium" | "Advanced"
  timeToDeliver: string
  pitchLine: string
}

export interface IndustryPlaybook {
  id: string
  industry: string
  emoji: string
  description: string
  avgDealSize: string
  topPain: string
  useCases: PlaybookUseCase[]
}

export const PLAYBOOK_MANIFEST: IndustryPlaybook[] = [
  {
    id: "hvac",
    industry: "HVAC & Plumbing",
    emoji: "🔧",
    description: "High-ticket services, seasonal demand, and customers who need 24/7 emergency response.",
    avgDealSize: "$1,500–$3,500/mo",
    topPain: "Missing calls after hours and losing leads to faster competitors.",
    useCases: [
      {
        id: "hvac-ai-receptionist",
        title: "AI Receptionist + Booking Bot",
        problem: "Miss 40% of calls after 5pm and on weekends. Competitors answer — they book.",
        solution: "AI voice agent answers 24/7, qualifies the emergency vs. routine, books into their scheduling software.",
        tools: ["Vapi", "Zapier", "Google Calendar"],
        monthlyValue: "$800–$1,500/mo",
        difficulty: "Easy",
        timeToDeliver: "3–5 days",
        pitchLine: "You're losing $X per missed call. I'll have an AI agent answering your phone 24/7 by Friday.",
      },
      {
        id: "hvac-review-automation",
        title: "Automated Review Generation",
        problem: "Competitors have 200+ Google reviews. They have 15. Customers don't trust them.",
        solution: "After each job, SMS + email review request sent automatically. Negative feedback routed to owner, positive to Google.",
        tools: ["Make", "Twilio (via Zapier)", "Google Business API"],
        monthlyValue: "$400–$600/mo",
        difficulty: "Easy",
        timeToDeliver: "1–2 days",
        pitchLine: "Your competitor has 10x your Google reviews. I can automate that process and change this within 90 days.",
      },
      {
        id: "hvac-seasonal-reactivation",
        title: "Seasonal Customer Reactivation",
        problem: "They have 500 past customers they've never followed up with for annual maintenance.",
        solution: "AI-generated seasonal campaign: SMS + email blast with personalized timing (last service date), offer a tune-up.",
        tools: ["Instantly", "Claude", "Google Sheets"],
        monthlyValue: "$600/mo",
        difficulty: "Medium",
        timeToDeliver: "5–7 days",
        pitchLine: "You have 500 past customers who haven't heard from you in 2 years. Let's fix that this week.",
      },
    ],
  },
  {
    id: "dental",
    industry: "Dental Offices",
    emoji: "🦷",
    description: "High LTV patients, appointment-heavy operations, and insurance paperwork.",
    avgDealSize: "$1,200–$2,500/mo",
    topPain: "No-shows, insurance follow-ups, and front desk overwhelm.",
    useCases: [
      {
        id: "dental-noshow-reduction",
        title: "No-Show Reduction System",
        problem: "15–25% no-show rate. Each empty chair costs $300–$800 of lost revenue.",
        solution: "Automated SMS/email reminders at 72h, 24h, and 2h before appointment. Easy one-tap confirm/reschedule.",
        tools: ["Make", "Twilio", "Google Sheets"],
        monthlyValue: "$800–$1,200/mo",
        difficulty: "Easy",
        timeToDeliver: "3–5 days",
        pitchLine: "A 20% no-show rate means you're leaving $X on the table every month. I can cut that in half.",
      },
      {
        id: "dental-insurance-followup",
        title: "Insurance Claim Follow-Up Bot",
        problem: "Staff spends 2–3 hours/day calling insurance companies to check claim status.",
        solution: "AI workflow checks claim status via portal scraping, surfaces pending claims, drafts follow-up letters.",
        tools: ["n8n", "Claude", "Google Sheets"],
        monthlyValue: "$1,000–$1,500/mo",
        difficulty: "Advanced",
        timeToDeliver: "2–3 weeks",
        pitchLine: "Your front desk is spending 3 hours a day on hold with insurance. That's $X/month in labor I can automate.",
      },
      {
        id: "dental-patient-reactivation",
        title: "Lapsed Patient Reactivation",
        problem: "Hundreds of patients who haven't been in for 18+ months. Not following up.",
        solution: "Segment by last visit date, run AI-personalized email + SMS campaign to re-book cleanings.",
        tools: ["Instantly", "Claude", "CSV export from their system"],
        monthlyValue: "$600–$800/mo",
        difficulty: "Easy",
        timeToDeliver: "5–7 days",
        pitchLine: "You have 300 patients you haven't seen in 2 years. A single campaign to them could fill your calendar for 3 months.",
      },
    ],
  },
  {
    id: "real-estate",
    industry: "Real Estate Agents",
    emoji: "🏠",
    description: "Commission-heavy, relationship-driven, and terrible at systematic follow-up.",
    avgDealSize: "$1,500–$4,000/mo",
    topPain: "Leads go cold because they can't follow up fast enough.",
    useCases: [
      {
        id: "re-instant-lead-response",
        title: "Instant Lead Response System",
        problem: "Internet leads go cold within 5 minutes if not contacted. Agents respond in 6+ hours.",
        solution: "AI agent responds to Zillow/Realtor.com leads within 60 seconds, qualifies buyer/seller, books a showing.",
        tools: ["Vapi", "n8n", "CRM API"],
        monthlyValue: "$1,500–$3,000/mo",
        difficulty: "Medium",
        timeToDeliver: "1–2 weeks",
        pitchLine: "You're paying $500/mo for Zillow leads. If you're not calling back in 5 minutes, you're giving them to a competitor.",
      },
      {
        id: "re-past-client-nurture",
        title: "Past Client Referral Engine",
        problem: "80% of buyers say they'd use the same agent again — but only 12% do, because agents don't stay top of mind.",
        solution: "Monthly AI-personalized touchpoint: market update, home anniversary, neighborhood news. Referral ask at 6-month mark.",
        tools: ["Instantly", "Claude", "Google Sheets"],
        monthlyValue: "$800–$1,200/mo",
        difficulty: "Easy",
        timeToDeliver: "5–7 days",
        pitchLine: "You have 200 past clients who love you. The problem is you're not in front of them — your competitor is.",
      },
    ],
  },
  {
    id: "restaurants",
    industry: "Restaurants & Food Service",
    emoji: "🍕",
    description: "Thin margins, high labor costs, and customers who live on social media.",
    avgDealSize: "$500–$1,200/mo",
    topPain: "Empty tables on slow nights and no system for repeat business.",
    useCases: [
      {
        id: "restaurant-reactivation",
        title: "'We Miss You' Reactivation Campaign",
        problem: "They have 2,000 emails from online orders but have never sent a single promotional message.",
        solution: "Segment by last order date, send AI-crafted 'we miss you' offer with SMS + email. A/B test the offer.",
        tools: ["Instantly", "Claude", "CSV export"],
        monthlyValue: "$400–$600/mo",
        difficulty: "Easy",
        timeToDeliver: "3–5 days",
        pitchLine: "You have 2,000 people who've already eaten here and given you their email. One campaign to them is $X in revenue.",
      },
      {
        id: "restaurant-review-ai",
        title: "AI Review Response + Generation",
        problem: "Owner spends 30 min/day responding to Google reviews, often poorly. Negative reviews go unanswered.",
        solution: "AI drafts responses to every review in their brand voice. Positive experience triggers automated review request.",
        tools: ["Claude", "Zapier", "Google Business API"],
        monthlyValue: "$300–$500/mo",
        difficulty: "Easy",
        timeToDeliver: "2–3 days",
        pitchLine: "I'll save you 30 minutes every day responding to reviews — and your responses will actually be good.",
      },
    ],
  },
  {
    id: "law-firms",
    industry: "Law Firms",
    emoji: "⚖️",
    description: "High-value clients, intake-heavy operations, and overwhelmed paralegals.",
    avgDealSize: "$2,000–$5,000/mo",
    topPain: "Slow intake process loses clients to faster competitors.",
    useCases: [
      {
        id: "law-intake-automation",
        title: "AI-Powered Client Intake",
        problem: "Intake forms take 3–5 days to process. Prospective clients call 3 firms — the first one to respond wins.",
        solution: "24/7 AI chat handles initial intake, qualifies the case type, books a consultation, and syncs to their case management system.",
        tools: ["Relevance AI", "Zapier", "Calendly"],
        monthlyValue: "$2,000–$3,500/mo",
        difficulty: "Medium",
        timeToDeliver: "1–2 weeks",
        pitchLine: "Personal injury clients call 3 firms. The one that responds fastest wins. I'll make sure that's you.",
      },
      {
        id: "law-document-summarization",
        title: "AI Document Summarization",
        problem: "Paralegals spend 2–4 hours summarizing discovery documents, depositions, and contracts.",
        solution: "Claude-powered document pipeline: drop a PDF in, get a structured summary with key dates, parties, obligations.",
        tools: ["Claude API", "Make", "Google Drive"],
        monthlyValue: "$1,500–$2,500/mo",
        difficulty: "Medium",
        timeToDeliver: "1–2 weeks",
        pitchLine: "Your paralegals are spending $X/hour reading PDFs I can summarize in 30 seconds.",
      },
    ],
  },
  {
    id: "e-commerce",
    industry: "E-Commerce Brands",
    emoji: "🛒",
    description: "DTC brands with email lists, ad spend, and abandoned cart problems.",
    avgDealSize: "$1,000–$3,000/mo",
    topPain: "70% cart abandonment and no systematic win-back process.",
    useCases: [
      {
        id: "ecom-abandoned-cart",
        title: "AI-Personalized Abandoned Cart Recovery",
        problem: "Standard abandoned cart emails get 3–5% recovery. They're generic.",
        solution: "Claude-generated abandoned cart emails personalized to cart contents, browse history, and customer segment. 3-step sequence.",
        tools: ["Claude", "Make", "Klaviyo/Shopify"],
        monthlyValue: "$1,000–$2,000/mo",
        difficulty: "Medium",
        timeToDeliver: "1–2 weeks",
        pitchLine: "You're recovering 4% of abandoned carts. Personalized AI emails will push that to 10–15%.",
      },
      {
        id: "ecom-ai-product-descriptions",
        title: "AI Product Description Generator",
        problem: "They have 500 products with weak descriptions. No time to write them. SEO is suffering.",
        solution: "Claude batch-generates product descriptions at scale from CSV: title, category, key features → polished, SEO-optimized copy.",
        tools: ["Claude API", "Make", "Shopify API"],
        monthlyValue: "$800–$1,500/mo",
        difficulty: "Easy",
        timeToDeliver: "3–5 days",
        pitchLine: "Your 500 product pages are costing you Google traffic. I'll rewrite all of them in a week using AI.",
      },
    ],
  },
]
