"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface CartItem {
  serviceId: string
  slug: string
  name: string
  tierId?: string
  tierName?: string
  priceMonthly: number // cents
}

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (serviceId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.serviceId === item.serviceId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = item
        return updated
      }
      return [...prev, item]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => prev.filter((i) => i.serviceId !== serviceId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const total = items.reduce((sum, i) => sum + i.priceMonthly, 0)

  return (
    <CartContext.Provider value={{ items, isOpen, addItem, removeItem, clearCart, openCart, closeCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

const EMPTY_CART: CartContextValue = {
  items: [],
  isOpen: false,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  openCart: () => {},
  closeCart: () => {},
  total: 0,
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  return ctx ?? EMPTY_CART
}
