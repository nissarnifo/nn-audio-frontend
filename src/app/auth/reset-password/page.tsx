'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useResetPassword } from '@/hooks'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const { mutateAsync, isPending } = useResetPassword()

  const [form, setForm] = useState({ newPassword: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Missing reset token. Please use the link from your email.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    try {
      await mutateAsync({ token, newPassword: form.newPassword })
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Invalid or expired reset link.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">RESET PASSWORD</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Set your new password below</p>
        </div>

        <div className="hud-card p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#E8F4FD] font-mono text-sm">Password reset successfully!</p>
              <p className="text-[#4A7FA5] text-xs font-mono">Redirecting to sign in...</p>
              <Link href="/auth/login" className="block text-[#00D4FF] text-sm hover:underline">
                Sign In Now
              </Link>
            </div>
          ) : error && !token ? (
            <div className="text-center space-y-4">
              <p className="text-red-400 font-mono text-sm">{error}</p>
              <Link href="/auth/forgot-password" className="text-[#00D4FF] text-sm hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                  <p className="text-red-400 text-sm font-mono">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">NEW PASSWORD (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="input-hud pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  required
                  className="input-hud"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn-cyan w-full py-3 flex items-center justify-center gap-2"
              >
                {isPending ? 'RESETTING...' : 'RESET PASSWORD'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-[#4A7FA5] font-mono">Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
