import { Navbar } from "@/components/marketing/Navbar"
import { Footer } from "@/components/marketing/Footer"
import { IntakeChatWidget } from "@/components/marketing/IntakeChatWidget"
import { PageTransition } from "@/components/shared/PageTransition"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16"><PageTransition>{children}</PageTransition></main>
      <Footer />
      <IntakeChatWidget />
    </div>
  )
}
