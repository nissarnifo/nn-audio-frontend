'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isAdmin: boolean
  setUser: (user: User, token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isAdmin: false,

      setUser(user, token) {
        set({ user, token, isLoggedIn: true, isAdmin: user.role === 'ADMIN' })
      },

      updateUser(partial) {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...partial } })
      },

      logout() {
        set({ user: null, token: null, isLoggedIn: false, isAdmin: false })
      },
    }),
    { name: 'nn-auth' }
  )
)
