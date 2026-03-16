'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

interface WishlistState {
  items: Product[]
  count: number
  toggle: (product: Product) => void
  has: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,

      toggle(product) {
        const exists = get().items.some((p) => p.id === product.id)
        const items = exists
          ? get().items.filter((p) => p.id !== product.id)
          : [...get().items, product]
        set({ items, count: items.length })
      },

      has(productId) {
        return get().items.some((p) => p.id === productId)
      },

      remove(productId) {
        const items = get().items.filter((p) => p.id !== productId)
        set({ items, count: items.length })
      },

      clear() {
        set({ items: [], count: 0 })
      },
    }),
    { name: 'nn-wishlist' }
  )
)
