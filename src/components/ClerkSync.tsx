'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const RETRY_DELAYS = [4000, 6000, 8000, 10000, 15000, 20000] // ms

export default function ClerkSync() {
  const { user, isSignedIn, isLoaded } = useUser()
  const { setUser, logout, token } = useAuthStore()
  const synced = useRef(false)
  const prevUserId = useRef<string | null>(null)
  const syncStarted = useRef(false)

  useEffect(() => {
    if (!isLoaded) return

    // User signed out from Clerk → clear backend auth
    if (!isSignedIn) {
      if (prevUserId.current) {
        logout()
        synced.current = false
        syncStarted.current = false
        prevUserId.current = null
      }
      return
    }

    // Already synced for this user session
    if (synced.current && prevUserId.current === user.id && token) return

    // Prevent double-firing
    if (syncStarted.current && prevUserId.current === user.id) return

    prevUserId.current = user.id
    syncStarted.current = true

    const syncToBackend = async () => {
      // Fire a warmup ping (backend may be sleeping on free tier)
      fetch('/api/warmup').catch(() => {})

      const toastId = toast.loading('Connecting to server…', { duration: Infinity })

      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
          const res = await fetch('/api/auth/clerk-sync', { method: 'POST' })

          if (res.ok) {
            const data = await res.json()
            if (data.token && data.user) {
              setUser(data.user as User, data.token)
              synced.current = true
              toast.success('Signed in!', { id: toastId })
              return
            }
          }

          const status = res.status
          // Retryable: backend sleeping (502/503/504/500)
          if ([500, 502, 503, 504].includes(status) && attempt < RETRY_DELAYS.length) {
            toast.loading(`Server waking up… (${attempt + 2}/${RETRY_DELAYS.length + 1})`, {
              id: toastId, duration: Infinity,
            })
            await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
            continue
          }

          // Non-retryable error
          toast.error('Could not connect to server — please try again.', { id: toastId })
          return
        } catch {
          if (attempt < RETRY_DELAYS.length) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
          } else {
            toast.dismiss(toastId)
            toast(
              (t) => (
                <span className="flex flex-col gap-1.5">
                  <span>Server took too long to start.</span>
                  <button
                    className="text-[#00D4FF] underline text-left"
                    onClick={() => { toast.dismiss(t.id); window.location.reload() }}
                  >
                    Click here to retry
                  </button>
                </span>
              ),
              { duration: Infinity }
            )
          }
        }
      }
    }

    syncToBackend()
  }, [isLoaded, isSignedIn, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
