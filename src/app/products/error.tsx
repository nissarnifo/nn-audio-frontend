'use client'
import { useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function ProductsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[ProductsError]', error) }, [error])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <WifiOff size={40} className="text-[#4A7FA5]" />
      <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wide">Failed to load products</h2>
      <p className="text-[#4A7FA5] font-mono text-sm max-w-sm">
        Could not connect to the server. Please check your connection and try again.
      </p>
      <button onClick={reset} className="mt-2 px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
        RETRY
      </button>
    </div>
  )
}
