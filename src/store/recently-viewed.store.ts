'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

const MAX_ITEMS = 8

interface RecentlyViewedState {
  items: Product[]
  record: (product: Product) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      record(product) {
        const filtered = get().items.filter((p) => p.id !== product.id)
        const items = [product, ...filtered].slice(0, MAX_ITEMS)
        set({ items })
      },

      clear() {
        set({ items: [] })
      },
    }),
    { name: 'nn-recently-viewed' }
  )
)
