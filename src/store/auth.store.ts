'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

/**
 * Stores the backend JWT + user record (with role) obtained after Clerk auth.
 * Clerk manages the identity session; this store holds the API authorization token.
 * Populated by ClerkSync after every Clerk sign-in, cleared on sign-out.
 */
interface AuthState {
  _hasHydrated: boolean
  user: User | null
  token: string | null
  /** true once the backend JWT has been obtained after Clerk sign-in */
  isLoggedIn: boolean
  isAdmin: boolean
  setUser: (user: User, token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
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
    {
      name: 'nn-auth',
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true
      },
    }
  )
)
