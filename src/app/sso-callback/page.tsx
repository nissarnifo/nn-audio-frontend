'use client'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Spinner } from '@/components/ui'

export default function SSOCallbackPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size={32} />
        <p className="text-[#4A7FA5] font-mono text-sm tracking-widest">AUTHENTICATING…</p>
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/"
        afterSignUpUrl="/"
      />
    </div>
  )
}
