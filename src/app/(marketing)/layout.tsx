import { Navbar } from "@/components/marketing/Navbar"
import { Footer } from "@/components/marketing/Footer"
import { CartProvider } from "@/components/shared/CartContext"
import { CartDrawer } from "@/components/shared/CartDrawer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  )
}
