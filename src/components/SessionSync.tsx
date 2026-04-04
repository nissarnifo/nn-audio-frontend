'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'

export default function SessionSync() {
  const { data: session, status } = useSession()
  const setUser = useAuthStore((s) => s.setUser)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const synced = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || synced.current || isLoggedIn) return
    if (!session.oauthProvider) return

    // If the JWT callback already synced (backendToken present), use it directly
    if (session.backendToken && session.backendUser) {
      setUser(session.backendUser as unknown as User, session.backendToken)
      synced.current = true
      return
    }

    // Fallback: call sync-oauth route (same-origin, always fast on Vercel)
    fetch('/api/auth/sync-oauth', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.token && data.user) {
          setUser(data.user as User, data.token)
          synced.current = true
        }
      })
      .catch(console.error)
  }, [status, session, isLoggedIn, setUser])

  return null
}
