'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'

// OAuth callback is handled by NextAuth at /api/auth/callback/[provider]
export default function SSOCallbackPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size={32} />
        <p className="text-[#4A7FA5] font-mono text-sm tracking-widest">AUTHENTICATING…</p>
      </div>
    </div>
  )
}
