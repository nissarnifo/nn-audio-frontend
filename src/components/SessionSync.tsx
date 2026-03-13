'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import toast from 'react-hot-toast'

export default function SessionSync() {
  const { data: session, status, update } = useSession()
  const setUser = useAuthStore((s) => s.setUser)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const synced = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || synced.current) return

    // Case 1: backend sync already succeeded during OAuth — just update Zustand
    if (session.backendToken && session.backendUser) {
      setUser(session.backendUser as unknown as User, session.backendToken)
      synced.current = true
      return
    }

    // Case 2: backend was asleep during OAuth — retry now
    if (session.oauthProvider && !isLoggedIn) {
      ;(async () => {
        try {
          const res = await fetch('/api/auth/sync-oauth', { method: 'POST' })
          if (res.ok) {
            const data = await res.json()
            if (data.token && data.user) {
              setUser(data.user as User, data.token)
              synced.current = true
              // Refresh NextAuth session so future reloads have backendToken
              await update()
            }
          } else {
            toast.error('Login failed — please try again')
          }
        } catch {
          toast.error('Could not connect to server. Try again in a moment.')
        }
      })()
    }
  }, [status, session, isLoggedIn, setUser, update])

  return null
}
