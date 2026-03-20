import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google"
import { Toaster } from "sonner"

import "./globals.css"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <ClerkProvider
      appearance={{
        layout: {
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
          formButtonPrimary: "bg-[#C4972A] hover:bg-[#A17D22] text-[#08090D] font-semibold uppercase tracking-wider text-xs",
          footerActionLink: "text-[#C4972A] hover:text-[#E8C46A]",
        },
      }}
    >
      <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased grain-overlay">
          {children}
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
    </ClerkProvider>
  )
}
