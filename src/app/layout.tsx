import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Cormorant_Garamond, DM_Sans, DM_Mono, Inter, Playfair_Display } from "next/font/google"
import { Toaster } from "sonner"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
})

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})


export const metadata: Metadata = {
  title: {
    default: "AIMS - AI-Powered Business Infrastructure",
    template: "%s | AIMS",
  },
  description:
    "Your always-on AI-powered lead generation partner. Outbound campaigns, AI calling systems, and lead reactivation programs that fill your pipeline.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aimseos.com",
    siteName: "AIMS",
    title: "AIMS - AI-Powered Business Infrastructure",
    description:
      "More qualified meetings. Less wasted ad spend. AI-powered outbound, inbound, and reactivation systems.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIMS - AI-Powered Business Infrastructure",
    description:
      "More qualified meetings. Less wasted ad spend. AI-powered outbound, inbound, and reactivation systems.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} ${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        {/* IDPixel — anonymous visitor identification for retargeting the bounced traffic. */}
        <script
          src="https://cdn.idpixel.app/v1/idp-analytics-69d59af7d233fe5c1d74bf6d.min.js"
          defer
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased grain-overlay">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            options: {
              logoImageUrl: "https://aimseos.com/logo.png",
              logoLinkUrl: "https://aimseos.com",
            },
            variables: {
              colorPrimary: "#C4972A",
              colorBackground: "#0E1219",
              colorText: "#F0EBE0",
              colorInputBackground: "#141923",
              colorInputText: "#F0EBE0",
              borderRadius: "0.25rem",
            },
            elements: {
              card: "shadow-lg border border-[rgba(255,255,255,0.07)]",
              headerTitle: "font-bold text-[#F0EBE0]",
              headerSubtitle: "text-[#F0EBE0]/60",
              formFieldLabel: "text-[#F0EBE0]",
              formFieldInput: "text-[#F0EBE0] bg-[#141923] border-[rgba(255,255,255,0.1)]",
              formFieldHintText: "text-[#F0EBE0]/50",
              formFieldInfoText: "text-[#F0EBE0]/50",
              formFieldSuccessText: "text-green-400",
              formFieldErrorText: "text-red-400",
              formButtonPrimary: "bg-[#C4972A] hover:bg-[#A17D22] text-[#08090D] font-semibold uppercase tracking-wider text-xs",
              formButtonReset: "text-[#C4972A] hover:text-[#E8C46A]",
              footerActionLink: "text-[#C4972A] hover:text-[#E8C46A]",
              footerActionText: "text-[#F0EBE0]/60",
              identityPreviewText: "text-[#F0EBE0]",
              identityPreviewEditButtonIcon: "text-[#C4972A]",
              userButtonPopoverCard: "bg-[#141923] border border-[rgba(255,255,255,0.07)]",
              userButtonPopoverActionButton: "text-[#F0EBE0] hover:bg-[rgba(255,255,255,0.05)]",
              userButtonPopoverActionButtonText: "text-[#F0EBE0]",
              userButtonPopoverActionButtonIcon: "text-[#F0EBE0]/60",
              userButtonPopoverFooter: "hidden",
              userPreviewMainIdentifier: "text-[#F0EBE0]",
              userPreviewSecondaryIdentifier: "text-[#F0EBE0]/60",
              alertText: "text-[#F0EBE0]",
              dividerLine: "bg-[rgba(255,255,255,0.07)]",
              dividerText: "text-[#F0EBE0]/40",
              socialButtonsBlockButton: "border-[rgba(255,255,255,0.1)] text-[#F0EBE0] hover:bg-[rgba(255,255,255,0.05)]",
              socialButtonsBlockButtonText: "text-[#F0EBE0]",
              otpCodeFieldInput: "text-[#F0EBE0] bg-[#141923] border-[rgba(255,255,255,0.1)]",
              alternativeMethodsBlockButton: "text-[#F0EBE0] border-[rgba(255,255,255,0.1)]",
            },
          }}
        >
          {children}
        </ClerkProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: '0.125rem',
              background: '#141923',
              color: '#F0EBE0',
              border: '1px solid rgba(255,255,255,0.07)',
            },
          }}
        />
      </body>
    </html>
  )
}
