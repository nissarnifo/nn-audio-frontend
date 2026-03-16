import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

const MAX = 3

interface CompareState {
  items: Product[]
  add: (product: Product) => void
  remove: (productId: string) => void
  has: (productId: string) => boolean
  clear: () => void
  isFull: () => boolean
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      add(product) {
        if (get().items.length >= MAX) return
        if (get().has(product.id)) return
        set((s) => ({ items: [...s.items, product] }))
      },

      remove(productId) {
        set((s) => ({ items: s.items.filter((p) => p.id !== productId) }))
      },

      has(productId) {
        return get().items.some((p) => p.id === productId)
      },

      clear() {
        set({ items: [] })
      },

      isFull() {
        return get().items.length >= MAX
      },
    }),
    { name: 'nn-compare' }
  )
)
