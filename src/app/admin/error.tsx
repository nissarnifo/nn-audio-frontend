'use client'
import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[AdminError]', error) }, [error])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="font-mono text-[#FF6B6B] text-4xl">✕</div>
      <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wide">Admin panel error</h2>
      <p className="text-[#4A7FA5] font-mono text-sm max-w-sm">{error.message || 'An unexpected error occurred in the admin panel.'}</p>
      <button onClick={reset} className="mt-2 px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
        RETRY
      </button>
    </div>
  )
}
