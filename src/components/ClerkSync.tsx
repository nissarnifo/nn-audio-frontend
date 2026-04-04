'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'

/**
 * Runs on every page. When Clerk signs in a user, calls /api/auth/clerk-sync
 * to get a backend JWT and stores it in Zustand so all API calls are authorized.
 * On sign-out, clears the Zustand store.
 */
export default function ClerkSync() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { setUser, logout, isLoggedIn } = useAuthStore()
  const syncedClerkId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    // Signed out — clear store
    if (!isSignedIn) {
      if (isLoggedIn) logout()
      syncedClerkId.current = null
      return
    }

    // Already synced this Clerk user — skip
    if (syncedClerkId.current === user.id) return

    async function sync() {
      try {
        const res = await fetch('/api/auth/clerk-sync', { method: 'POST' })
        if (!res.ok) throw new Error(`clerk-sync returned ${res.status}`)
        const data = await res.json()
        if (data.token && data.user) {
          setUser(data.user as User, data.token)
          syncedClerkId.current = user!.id
        }
      } catch (err) {
        console.error('[ClerkSync]', err)
      }
    }

    sync()
  }, [isLoaded, isSignedIn, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
