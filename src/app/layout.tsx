import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import Script from "next/script"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})


export const metadata: Metadata = {
  title: {
    default: "AIMS — AI-Powered Business Infrastructure",
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
    title: "AIMS — AI-Powered Business Infrastructure",
    description:
      "More qualified meetings. Less wasted ad spend. AI-powered outbound, inbound, and reactivation systems.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIMS — AI-Powered Business Infrastructure",
    description:
      "More qualified meetings. Less wasted ad spend. AI-powered outbound, inbound, and reactivation systems.",
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
          colorPrimary: "#DC2626",
          colorBackground: "#ffffff",
          colorText: "#111827",
          colorInputBackground: "#f9fafb",
          colorInputText: "#111827",
          borderRadius: "0.375rem",
        },
        elements: {
          card: "shadow-lg border border-gray-100",
          headerTitle: "font-bold text-gray-900",
          headerSubtitle: "text-gray-500",
          formButtonPrimary: "bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold uppercase tracking-wider text-xs",
          footerActionLink: "text-[#DC2626] hover:text-[#B91C1C]",
        },
      }}
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{ style: { borderRadius: '0.75rem' } }}
          />
          <Script id="crisp-chat" strategy="afterInteractive">
            {`window.$crisp=[];window.CRISP_WEBSITE_ID="25695ffa-8ffa-4b59-b5ad-5a509107c9c1";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  )
}
