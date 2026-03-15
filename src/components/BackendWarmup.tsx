'use client'
import { useEffect, useState } from 'react'
import { useServerStore } from '@/store/server.store'

type Status = 'checking' | 'ready' | 'waking'

// Give up after 20 attempts (2 min) and unblock the form anyway
const MAX_ATTEMPTS = 20

export default function BackendWarmup() {
  const [status, setStatus] = useState<Status>('checking')
  const setServerReady = useServerStore((s) => s.setServerReady)

  useEffect(() => {
    let cancelled = false
    let attempt = 0

    async function ping() {
      while (!cancelled) {
        try {
          const res = await fetch('/api/warmup')
          if (res.ok) {
            if (!cancelled) {
              setStatus('ready')
              setServerReady()
            }
            return
          }
        } catch {
          // network error — keep retrying
        }

        if (!cancelled) {
          attempt++
          // After MAX_ATTEMPTS give up waiting and unblock the form
          if (attempt >= MAX_ATTEMPTS) {
            setStatus('ready')
            setServerReady()
            return
          }
          setStatus(attempt === 1 ? 'checking' : 'waking')
          await new Promise((r) => setTimeout(r, 6000))
        }
      }
    }

    ping()
    return () => { cancelled = true }
  }, [setServerReady])

  if (status === 'ready') return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,212,255,0.3)] bg-[rgba(13,27,42,0.92)] text-[#4A7FA5] font-mono text-xs backdrop-blur-sm shadow-lg whitespace-nowrap">
      <span className="inline-block w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
      {status === 'checking'
        ? 'Connecting to server…'
        : 'Server is starting up (Render free tier) — login will work shortly'}
    </div>
  )
}
