'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AccountError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[AccountError]', error) }, [error])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-[#00D4FF] font-mono text-4xl">⚠</div>
      <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wide">Failed to load account data</h2>
      <p className="text-[#4A7FA5] font-mono text-sm max-w-sm">
        There was a problem loading your account information.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
          RETRY
        </button>
        <Link href="/" className="px-6 py-2.5 border border-[rgba(0,212,255,0.3)] text-[#A8C8E0] font-mono text-sm rounded hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors">
          HOME
        </Link>
      </div>
    </div>
  )
}
