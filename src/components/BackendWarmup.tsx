'use client'
import { useEffect } from 'react'
import { useServerStore } from '@/store/server.store'

// Backend is now on Vercel — no warmup needed. Mark server as ready immediately.
export default function BackendWarmup() {
  const setServerReady = useServerStore((s) => s.setServerReady)
  useEffect(() => { setServerReady() }, [setServerReady])
  return null
}
