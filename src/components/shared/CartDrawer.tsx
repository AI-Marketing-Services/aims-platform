"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, ShoppingCart, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { useCart } from "./CartContext"

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, total } = useCart()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!items.length) return
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={closeCart}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                  <span className="text-base font-bold text-gray-900">Your Cart</span>
                  {items.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-[11px] font-bold text-white">
                      {items.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <ShoppingCart className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">Your cart is empty</p>
                    <p className="mt-1 text-xs text-gray-400">Add services from the marketplace to get started.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.serviceId} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</p>
                        {item.tierName && (
                          <p className="mt-0.5 text-xs text-gray-500">{item.tierName} plan</p>
                        )}
                        <p className="mt-1.5 text-sm font-bold text-[#DC2626]">{formatPrice(item.priceMonthly)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.serviceId)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 space-y-4">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Monthly total</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Billed monthly. Cancel anytime. Final scoping confirmed after onboarding call.
                  </p>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#DC2626] text-white text-sm font-bold rounded-xl hover:bg-[#B91C1C] disabled:opacity-60 transition-colors"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <>Checkout with Stripe <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
