'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const MAX_RETRIES = 12
const RETRY_DELAYS = [4000, 6000, 8000, 10000, 12000, 15000, 15000, 15000, 20000, 20000, 25000, 30000] // ms

async function syncWithRetry(
  update: () => Promise<unknown>,
  setUser: (user: User, token: string) => void,
  synced: React.MutableRefObject<boolean>
) {
  const toastId = toast.loading('Connecting to server, please wait…', { duration: Infinity })

  // Fire a warmup ping to wake the backend while we retry the sync
  fetch('/api/warmup').catch(() => {})

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
      // 503 = backend sleeping, 502 = gateway down, 504 = Vercel timeout, 500 = backend still initializing
      if ((status === 503 || status === 502 || status === 504 || status === 500) && attempt < MAX_RETRIES - 1) {
        toast.loading(
          `Server is waking up… (attempt ${attempt + 2}/${MAX_RETRIES})`,
          { id: toastId, duration: Infinity }
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
        continue
      }

      // Non-retryable error
      showRetryPrompt(toastId)
      return
    } catch {
      // Network error or fetch timeout — retry if attempts remain
      if (attempt < MAX_RETRIES - 1) {
        toast.loading(
          `Server is waking up… (attempt ${attempt + 2}/${MAX_RETRIES})`,
          { id: toastId, duration: Infinity }
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
      } else {
        showRetryPrompt(toastId)
      }
    }
  }
}

function showRetryPrompt(toastId: string) {
  toast.dismiss(toastId)
  toast(
    (t) => (
      <span className="flex flex-col gap-1.5">
        <span>Server took too long to start.</span>
        <button
          className="text-[#00D4FF] underline text-left"
          onClick={() => {
            toast.dismiss(t.id)
            window.location.reload()
          }}
        >
          Click here to try again
        </button>
      </span>
    ),
    { duration: Infinity }
  )
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
