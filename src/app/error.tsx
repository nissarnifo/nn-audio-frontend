'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[AppError]', error) }, [error])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E1A] px-4 text-center">
      <div className="text-[#00D4FF] text-5xl mb-4 font-mono">500</div>
      <h1 className="font-heading text-2xl text-[#E8F4FD] mb-2 tracking-wide">Something went wrong</h1>
      <p className="text-[#4A7FA5] font-mono text-sm mb-8 max-w-sm">
        {error.digest ? `Error reference: ${error.digest}` : 'An unexpected error occurred. Our team has been notified.'}
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
          TRY AGAIN
        </button>
        <Link href="/" className="px-6 py-2.5 border border-[rgba(0,212,255,0.3)] text-[#A8C8E0] font-mono text-sm rounded hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors">
          GO HOME
        </Link>
      </div>
    </div>
  )
}
