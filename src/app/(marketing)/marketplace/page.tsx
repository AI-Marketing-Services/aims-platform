import type { Metadata } from "next"
import { MarketplaceClient } from "./MarketplaceClient"

export const metadata: Metadata = {
  title: "Marketplace — Browse All AI Services",
  description: "Browse AIMS's full catalog of AI-powered marketing, sales, operations, and finance services.",
}

type ServiceStatus = "ACTIVE" | "COMING_SOON" | "BETA" | "INTERNAL_ONLY" | "DEPRECATED"
type ServicePillar = "MARKETING" | "SALES" | "OPERATIONS" | "FINANCE"

interface MarketplaceService {
  id: string
  slug: string
  name: string
  shortDesc: string
  pillar: ServicePillar
  status: ServiceStatus
  basePrice?: number
  pricingModel: string
  demoType?: string
  isFeatured: boolean
}

// Static service data for now (will be hydrated from DB once schema is pushed)
const SERVICES: MarketplaceService[] = [
  {
    id: "1",
    slug: "website-crm-chatbot",
    name: "Website + CRM + Chatbot",
    shortDesc: "GHL-powered website with built-in CRM and AI chatbot",
    pillar: "MARKETING",
    status: "ACTIVE",
    basePrice: 97,
    pricingModel: "MONTHLY",
    demoType: "interactive",
    isFeatured: true,
  },
  {
    id: "2",
    slug: "cold-outbound",
    name: "Cold Outbound Engine",
    shortDesc: "Multi-domain email infrastructure with AI SDR reply handling",
    pillar: "SALES",
    status: "ACTIVE",
    pricingModel: "CUSTOM",
    demoType: "interactive",
    isFeatured: true,
  },
  {
    id: "3",
    slug: "voice-agents",
    name: "AI Voice Agent Platform",
    shortDesc: "Inbound and outbound AI calling with multi-location routing",
    pillar: "SALES",
    status: "ACTIVE",
    pricingModel: "CUSTOM",
    demoType: "voice-player",
    isFeatured: true,
  },
  {
    id: "4",
    slug: "seo-aeo",
    name: "SEO & AEO Automation",
    shortDesc: "Search engine and AI answer engine optimization with monthly reporting",
    pillar: "MARKETING",
    status: "ACTIVE",
    pricingModel: "MONTHLY",
    isFeatured: false,
  },
  {
    id: "5",
    slug: "audience-targeting",
    name: "Audience Targeting & Segments",
    shortDesc: "20K+ prebuilt audience segments with semantic search and count builder",
    pillar: "SALES",
    status: "ACTIVE",
    pricingModel: "MONTHLY",
    demoType: "live-tool",
    isFeatured: false,
  },
  {
    id: "6",
    slug: "pixel-intelligence",
    name: "Pixel & Visitor Intelligence",
    shortDesc: "Website pixel with visitor identification, enrichment, and intent scoring",
    pillar: "SALES",
    status: "BETA",
    pricingModel: "MONTHLY",
    isFeatured: false,
  },
  {
    id: "7",
    slug: "finance-automation",
    name: "P&L Finance Automation",
    shortDesc: "QuickBooks-integrated quarterly P&L analysis with AI-generated insights",
    pillar: "FINANCE",
    status: "ACTIVE",
    basePrice: 1000,
    pricingModel: "QUARTERLY",
    isFeatured: false,
  },
  {
    id: "8",
    slug: "ai-tool-tracker",
    name: "AI Tool Tracker (Trackr)",
    shortDesc: "AI-powered tool research, scoring, and team evaluation platform",
    pillar: "OPERATIONS",
    status: "ACTIVE",
    pricingModel: "MONTHLY",
    demoType: "interactive",
    isFeatured: false,
  },
  {
    id: "9",
    slug: "lead-reactivation",
    name: "Lead Reactivation",
    shortDesc: "AI-powered campaigns that turn dead CRM leads into booked meetings",
    pillar: "SALES",
    status: "ACTIVE",
    pricingModel: "CUSTOM",
    isFeatured: false,
  },
  {
    id: "10",
    slug: "revops-pipeline",
    name: "RevOps Pipeline",
    shortDesc: "CRM cleanup, lead routing, attribution tracking, and conversion dashboards",
    pillar: "OPERATIONS",
    status: "ACTIVE",
    pricingModel: "CUSTOM",
    isFeatured: false,
  },
  {
    id: "11",
    slug: "content-production",
    name: "Content Production Pod",
    shortDesc: "AI-powered content creation with human review and multi-channel distribution",
    pillar: "MARKETING",
    status: "ACTIVE",
    pricingModel: "MONTHLY",
    isFeatured: false,
  },
  {
    id: "12",
    slug: "social-media-management",
    name: "Social Media Management",
    shortDesc: "AI-generated social content with scheduling and engagement tracking",
    pillar: "MARKETING",
    status: "COMING_SOON",
    pricingModel: "MONTHLY",
    isFeatured: false,
  },
]

export default function MarketplacePage() {
  return <MarketplaceClient services={SERVICES as MarketplaceService[]} />
}
