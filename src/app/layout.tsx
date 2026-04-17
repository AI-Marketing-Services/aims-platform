import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { DM_Sans, DM_Mono, Playfair_Display } from "next/font/google"
import { Toaster } from "sonner"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

// Only the fonts actually used on the site are loaded. Cormorant + Inter
// were previously imported but had zero usage across all pages — that
// extra network weight was causing the jolty FOUT on initial paint.

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
  weight: ["400", "500", "700"],
  preload: true,
})

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  adjustFontFallback: false, // DM Mono is only used for small labels — don't block render
  preload: false,
})

// Playfair is the headline display font. Preload it + use "optional" so the
// browser either shows the custom font on first paint (if ready in ~100ms)
// or stays on the fallback without swapping mid-read. This eliminates the
// visible text jump the user was seeing.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "optional",
  fallback: ["Georgia", "Cambria", "Times New Roman", "serif"],
  adjustFontFallback: true,
  preload: true,
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
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIMS - AI-Powered Business Infrastructure",
    description:
      "More qualified meetings. Less wasted ad spend. AI-powered outbound, inbound, and reactivation systems.",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png?v=2",
    shortcut: "/favicon.ico?v=2",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}>
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            options: {
              logoImageUrl: "https://aioperatorcollective.com/logo.png",
              logoLinkUrl: "https://aioperatorcollective.com",
            },
            variables: {
              colorPrimary: "#981B1B",
              colorBackground: "#FFFFFF",
              colorText: "#1A1A1A",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#1A1A1A",
              borderRadius: "0.375rem",
            },
            elements: {
              card: "shadow-lg border border-[#E3E3E3] bg-white",
              headerTitle: "font-bold text-[#1A1A1A]",
              headerSubtitle: "text-[#737373]",
              formFieldLabel: "text-[#1A1A1A]",
              formFieldInput: "text-[#1A1A1A] bg-white border-[#E3E3E3]",
              formFieldHintText: "text-[#737373]",
              formFieldInfoText: "text-[#737373]",
              formFieldSuccessText: "text-green-600",
              formFieldErrorText: "text-[#981B1B]",
              formButtonPrimary: "bg-[#981B1B] hover:bg-[#791515] text-white font-semibold uppercase tracking-wider text-xs",
              formButtonReset: "text-[#981B1B] hover:text-[#791515]",
              footerActionLink: "text-[#981B1B] hover:text-[#791515]",
              footerActionText: "text-[#737373]",
              identityPreviewText: "text-[#1A1A1A]",
              identityPreviewEditButtonIcon: "text-[#981B1B]",
              userButtonPopoverCard: "bg-white border border-[#E3E3E3]",
              userButtonPopoverActionButton: "text-[#1A1A1A] hover:bg-[#F5F5F5]",
              userButtonPopoverActionButtonText: "text-[#1A1A1A]",
              userButtonPopoverActionButtonIcon: "text-[#737373]",
              userButtonPopoverFooter: "hidden",
              userPreviewMainIdentifier: "text-[#1A1A1A]",
              userPreviewSecondaryIdentifier: "text-[#737373]",
              alertText: "text-[#1A1A1A]",
              dividerLine: "bg-[#E3E3E3]",
              dividerText: "text-[#737373]",
              socialButtonsBlockButton: "border-[#E3E3E3] text-[#1A1A1A] hover:bg-[#F5F5F5]",
              socialButtonsBlockButtonText: "text-[#1A1A1A]",
              otpCodeFieldInput: "text-[#1A1A1A] bg-white border-[#E3E3E3]",
              alternativeMethodsBlockButton: "text-[#1A1A1A] border-[#E3E3E3]",
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
              borderRadius: '0.375rem',
              background: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid #E3E3E3',
            },
          }}
        />
      </body>
    </html>
  )
}
