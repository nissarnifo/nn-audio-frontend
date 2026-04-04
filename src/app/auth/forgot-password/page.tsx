'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForgotPassword } from '@/hooks'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync, isPending } = useForgotPassword()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({ email })
    setSubmitted(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">FORGOT PASSWORD</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Enter your email to receive a reset link</p>
        </div>

        <div className="hud-card p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[#E8F4FD] font-mono text-sm">
                If <span className="text-[#00D4FF]">{email}</span> is registered, a reset link has been sent.
              </p>
              <p className="text-[#4A7FA5] text-xs font-mono">Check your inbox and follow the link. It expires in 1 hour.</p>
              <Link href="/auth/login" className="block mt-4 text-[#00D4FF] text-sm hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-hud"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn-cyan w-full py-3 flex items-center justify-center gap-2"
              >
                {isPending ? 'SENDING...' : 'SEND RESET LINK'}
              </button>

              <div className="text-center mt-2">
                <Link href="/auth/login" className="text-[#4A7FA5] text-sm hover:text-[#00D4FF] transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
