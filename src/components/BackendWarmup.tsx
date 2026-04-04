'use client'
import { useEffect } from 'react'
import { useServerStore } from '@/store/server.store'

// Vercel hosts both frontend and API — no warmup needed.
// This component immediately marks the server as ready.
export default function BackendWarmup() {
  const setServerReady = useServerStore((s) => s.setServerReady)

  useEffect(() => {
    setServerReady()
  }, [setServerReady])

  return null
}
