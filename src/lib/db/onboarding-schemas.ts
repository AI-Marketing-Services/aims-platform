interface FormField {
  name: string
  label: string
  type: "text" | "email" | "url" | "textarea" | "select" | "checkbox" | "file_url"
  placeholder?: string
  required?: boolean
  options?: string[]
  helpText?: string
}

export const DEFAULT_ONBOARDING_SCHEMAS: Record<string, FormField[]> = {
  "website-crm-chatbot": [
    {
      name: "currentWebsite",
      label: "Current Website URL",
      type: "url",
      required: true,
      placeholder: "https://...",
    },
    {
      name: "brandGuidelines",
      label: "Brand Guidelines URL",
      type: "url",
      helpText: "Link to your brand colors, fonts, logo files",
    },
    {
      name: "crmAccess",
      label: "Current CRM Platform",
      type: "select",
      options: ["None", "HubSpot", "Salesforce", "Zoho", "GoHighLevel", "Other"],
      required: true,
    },
    {
      name: "chatbotGoal",
      label: "Primary Chatbot Goal",
      type: "select",
      options: [
        "Lead capture",
        "Customer support",
        "FAQ answers",
        "Appointment booking",
        "Other",
      ],
      required: true,
    },
    {
      name: "additionalNotes",
      label: "Anything else we should know?",
      type: "textarea",
      placeholder: "Special requirements, integrations, etc.",
    },
  ],

  "cold-outbound": [
    {
      name: "idealCustomer",
      label: "Ideal Customer Profile",
      type: "textarea",
      required: true,
      placeholder: "Industry, company size, job titles you want to reach...",
    },
    {
      name: "valueProposition",
      label: "Your Main Value Proposition",
      type: "textarea",
      required: true,
      placeholder: "What problem do you solve and for whom?",
    },
    {
      name: "existingCollateral",
      label: "Link to Existing Sales Collateral",
      type: "url",
      helpText: "Case studies, one-pagers, pitch decks",
    },
    {
      name: "crmPlatform",
      label: "CRM Platform",
      type: "select",
      options: [
        "None",
        "HubSpot",
        "Salesforce",
        "Pipedrive",
        "Close",
        "GoHighLevel",
        "Other",
      ],
      required: true,
    },
    {
      name: "doNotContact",
      label: "Do-Not-Contact List URL",
      type: "url",
      helpText: "Google Sheet or CSV link",
    },
    {
      name: "additionalNotes",
      label: "Anything else?",
      type: "textarea",
    },
  ],

  "ai-voice-agents": [
    {
      name: "businessHours",
      label: "Business Hours",
      type: "text",
      required: true,
      placeholder: "Mon-Fri 9am-5pm EST",
    },
    {
      name: "callRouting",
      label: "Call Routing Rules",
      type: "textarea",
      required: true,
      placeholder: "How should calls be routed? Main line, departments, etc.",
    },
    {
      name: "faqDocument",
      label: "FAQ / Knowledge Base URL",
      type: "url",
      helpText:
        "Link to your FAQ, help docs, or key info for the AI agent",
    },
    {
      name: "brandVoice",
      label: "Brand Voice / Tone",
      type: "select",
      options: [
        "Professional",
        "Friendly & casual",
        "Technical",
        "Luxury/premium",
        "Other",
      ],
      required: true,
    },
    {
      name: "currentPhone",
      label: "Current Phone System",
      type: "select",
      options: [
        "None",
        "RingCentral",
        "Dialpad",
        "Twilio",
        "GoHighLevel",
        "Other",
      ],
    },
    {
      name: "additionalNotes",
      label: "Anything else?",
      type: "textarea",
    },
  ],

  "seo-aeo": [
    {
      name: "targetKeywords",
      label: "Target Keywords",
      type: "textarea",
      required: true,
      placeholder: "List your top 5-10 target keywords...",
    },
    {
      name: "competitors",
      label: "Top Competitors",
      type: "textarea",
      required: true,
      placeholder: "URLs of 3-5 competitors you want to outrank",
    },
    {
      name: "googleAccess",
      label: "Google Search Console Access",
      type: "select",
      options: [
        "Yes - can share",
        "No - need help setting up",
        "Not sure",
      ],
      required: true,
    },
    {
      name: "contentPreferences",
      label: "Content Preferences",
      type: "select",
      options: ["Blog posts", "Landing pages", "Both", "Let AIMS decide"],
      required: true,
    },
    {
      name: "additionalNotes",
      label: "Anything else?",
      type: "textarea",
    },
  ],

  "social-content": [
    {
      name: "platforms",
      label: "Target Platforms",
      type: "textarea",
      required: true,
      placeholder: "Instagram, LinkedIn, TikTok, X/Twitter, etc.",
    },
    {
      name: "brandVoice",
      label: "Brand Voice / Tone",
      type: "select",
      options: [
        "Professional",
        "Friendly & casual",
        "Witty / humorous",
        "Technical / authoritative",
        "Luxury / premium",
        "Other",
      ],
      required: true,
    },
    {
      name: "exampleAccounts",
      label: "Example Accounts You Like",
      type: "textarea",
      placeholder: "Links to social accounts whose style you admire",
    },
    {
      name: "postingFrequency",
      label: "Desired Posting Frequency",
      type: "select",
      options: [
        "3x per week",
        "5x per week",
        "Daily",
        "Let AIMS decide",
      ],
      required: true,
    },
    {
      name: "additionalNotes",
      label: "Anything else?",
      type: "textarea",
    },
  ],

  "paid-ads": [
    {
      name: "adPlatforms",
      label: "Ad Platforms",
      type: "select",
      options: [
        "Google Ads",
        "Meta (Facebook/Instagram)",
        "LinkedIn Ads",
        "TikTok Ads",
        "Multiple",
        "Not sure - need guidance",
      ],
      required: true,
    },
    {
      name: "monthlyBudget",
      label: "Monthly Ad Spend Budget",
      type: "text",
      required: true,
      placeholder: "$1,000 - $5,000",
    },
    {
      name: "targetAudience",
      label: "Target Audience",
      type: "textarea",
      required: true,
      placeholder: "Demographics, interests, geographic targeting...",
    },
    {
      name: "existingAdAccounts",
      label: "Existing Ad Account Access",
      type: "select",
      options: [
        "Yes - can grant access",
        "No - need new accounts",
        "Not sure",
      ],
      required: true,
    },
    {
      name: "landingPages",
      label: "Landing Page URLs",
      type: "textarea",
      placeholder: "URLs where you want to send ad traffic",
    },
    {
      name: "additionalNotes",
      label: "Anything else?",
      type: "textarea",
    },
  ],
}
