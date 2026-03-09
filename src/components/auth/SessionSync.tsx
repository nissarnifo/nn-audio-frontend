'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'

/**
 * Syncs NextAuth OAuth session into the Zustand auth store.
 * Mount this once in the root layout.
 */
export default function SessionSync() {
  const { data: session } = useSession()
  const { setUser, logout, isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (session?.backendToken && session?.backendUser && !isLoggedIn) {
      setUser(session.backendUser as unknown as User, session.backendToken)
    }
    if (!session && isLoggedIn) {
      // NextAuth session expired — keep Zustand as is (user may have logged in via email)
    }
  }, [session, isLoggedIn, setUser, logout])

  return null
}
