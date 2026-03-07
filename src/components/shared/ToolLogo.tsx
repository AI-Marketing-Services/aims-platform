"use client"

import Image from "next/image"
import { useState } from "react"

// Map domains to local files in /public/integrations/
const LOCAL_LOGOS: Record<string, string> = {
  "hubspot.com": "/integrations/hubspot-svgrepo-com.svg",
  "salesforce.com": "/integrations/salesforce.svg",
  "instantly.ai": "/integrations/instantly.webp",
  "slack.com": "/integrations/slack.png",
  "slack": "/integrations/slack.png",
  "apollo.io": "/integrations/apollo.svg",
  "notion.so": "/integrations/notion.svg",
  "openai.com": "/integrations/openai-svgrepo-com.svg",
  "linkedin.com": "/integrations/linkedin.svg",
  "google.com": "/integrations/google-ads-svgrepo-com.svg",
  "google-ads": "/integrations/google-ads-svgrepo-com.svg",
  "search.google.com": "/integrations/search-console-icon-2025-1.svg",
  "calendly.com": "/integrations/calendly.svg",
  "cal.com": "/integrations/calendly.svg",
  "airtable.com": "/integrations/airtable-svgrepo-com.svg",
  "shopify.com": "/integrations/shopify.svg",
  "github.com": "/integrations/github.svg",
  "meta.com": "/integrations/meta-color.svg",
  "facebook.com": "/integrations/meta-color.svg",
  "tiktok.com": "/integrations/tiktok.svg",
  "linear.app": "/integrations/linear.svg",
  "typeform.com": "/integrations/typeform.svg",
  "asana.com": "/integrations/asana.svg",
  "klaviyo.com": "/integrations/klaviyo.svg",
  "gmail.com": "/integrations/gmail.svg",
  "instagram.com": "/integrations/icons8-instagram.svg",
  "reddit.com": "/integrations/reddit-4.svg",
  "twitter.com": "/integrations/X_idJxGuURW1_0.svg",
  "x.com": "/integrations/X_idJxGuURW1_0.svg",
  "webflow.io": "/integrations/Webflow_id2IyfqSKv_0.svg",
  "webflow.com": "/integrations/Webflow_id2IyfqSKv_0.svg",
  "wordpress.com": "/integrations/icons8-wordpress.svg",
  "zoom.us": "/integrations/icons8-zoom.svg",
  "outlook.com": "/integrations/icons8-microsoft-outlook-2019.svg",
  "microsoft.com": "/integrations/icons8-microsoft-teams.svg",
  "teams.microsoft.com": "/integrations/icons8-microsoft-teams.svg",
  "excel.com": "/integrations/excel.svg",
  "stripe.com": "/integrations/stripe.svg",
  "gohighlevel.com": "/integrations/hubspot-svgrepo-com.svg", // GHL fallback to CRM icon
  "perplexity.ai": "/integrations/openai-svgrepo-com.svg",   // AI fallback
  "surferseo.com": "/integrations/search-console-icon-2025-1.svg",
  "surfer.com": "/integrations/search-console-icon-2025-1.svg",
  "ramp.com": "/integrations/airtable-svgrepo-com.svg",
  "quickbooks.com": "/integrations/excel.svg",
  "rb2b.com": "/integrations/firecrawl-logo.webp",
  "clay.com": "/integrations/apollo.svg", // Clay fallback to enrichment icon
  "trytrackr.com": "/integrations/notion.svg",
}

interface ToolLogoProps {
  domain: string
  name: string
  size?: number
  className?: string
}

export function ToolLogo({ domain, name, size = 20, className = "" }: ToolLogoProps) {
  const [failed, setFailed] = useState(false)
  const localSrc = LOCAL_LOGOS[domain]

  const initial = name.charAt(0).toUpperCase()
  const sizeClass = size <= 20 ? "h-5 w-5" : size <= 24 ? "h-6 w-6" : "h-8 w-8"

  if (failed || !localSrc) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-gray-100 text-[9px] font-bold text-gray-500 flex-shrink-0 ${sizeClass} ${className}`}
      >
        {initial}
      </span>
    )
  }

  return (
    <span className={`relative inline-block flex-shrink-0 ${sizeClass} ${className}`}>
      <Image
        src={localSrc}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  )
}
