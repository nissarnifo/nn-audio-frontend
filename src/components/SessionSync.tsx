'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const MAX_RETRIES = 10
const RETRY_DELAYS = [6000, 8000, 10000, 12000, 15000, 15000, 15000, 20000, 20000, 30000] // ms

async function syncWithRetry(
  update: () => Promise<unknown>,
  setUser: (user: User, token: string) => void,
  synced: React.MutableRefObject<boolean>
) {
  const toastId = toast.loading('Connecting to server, please wait…', { duration: Infinity })

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('/api/auth/sync-oauth', { method: 'POST' })

      if (res.ok) {
        const data = await res.json()
        if (data.token && data.user) {
          setUser(data.user as User, data.token)
          synced.current = true
          await update()
          toast.success('Signed in successfully!', { id: toastId })
          return
        }
      }

      const status = res.status
      // 503 = backend sleeping (Render cold start), 502 = gateway down — retry
      if ((status === 503 || status === 502) && attempt < MAX_RETRIES - 1) {
        toast.loading(
          `Server is waking up… (attempt ${attempt + 2}/${MAX_RETRIES})`,
          { id: toastId, duration: Infinity }
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
        continue
      }

      // Non-retryable error
      toast.error('Could not sign you in. Please try logging in again.', { id: toastId })
      return
    } catch {
      // Network error — retry if attempts remain
      if (attempt < MAX_RETRIES - 1) {
        toast.loading(
          `Cannot reach server, retrying… (${attempt + 2}/${MAX_RETRIES})`,
          { id: toastId, duration: Infinity }
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
      } else {
        toast.error('Could not connect to server. Please try again later.', { id: toastId })
      }
    }
  }
}

export default function SessionSync() {
  const { data: session, status, update } = useSession()
  const setUser = useAuthStore((s) => s.setUser)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const synced = useRef(false)
  const syncStarted = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || synced.current || syncStarted.current) return

    // Case 1: backend sync already succeeded during OAuth — just update Zustand
    if (session.backendToken && session.backendUser) {
      setUser(session.backendUser as unknown as User, session.backendToken)
      synced.current = true
      return
    }

    // Case 2: backend was asleep during OAuth — retry with backoff
    if (session.oauthProvider && !isLoggedIn) {
      syncStarted.current = true
      syncWithRetry(update, setUser, synced)
    }
  }, [status, session, isLoggedIn, setUser, update])

  return null
}
