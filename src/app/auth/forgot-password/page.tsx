'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

type Step = 'email' | 'code'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStep('code')
      toast.success('Reset code sent to your email!')
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; code: string }> }
      const errCode = clerkErr?.errors?.[0]?.code
      // Always show generic message to avoid user enumeration
      if (errCode === 'form_identifier_not_found') {
        // Silently succeed to avoid revealing if email is registered
        setStep('code')
        toast.success('If this email is registered, a reset code has been sent.')
      } else {
        toast.error(clerkErr?.errors?.[0]?.message || 'Failed to send reset code.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast.success('Password reset! You are now signed in.')
        router.push('/')
      } else {
        toast.error('Could not complete password reset. Please try again.')
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; code: string }> }
      const errCode = clerkErr?.errors?.[0]?.code
      const msg = clerkErr?.errors?.[0]?.message
      if (errCode === 'form_code_incorrect') {
        toast.error('Incorrect code. Please check your email.')
      } else if (errCode === 'verification_expired') {
        toast.error('Code expired. Please request a new one.')
        setStep('email')
      } else if (errCode === 'form_password_pwned') {
        toast.error('This password has been found in data breaches. Choose a stronger password.')
      } else {
        toast.error(msg || 'Password reset failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">
            {step === 'email' ? 'FORGOT PASSWORD' : 'RESET PASSWORD'}
          </div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="hud-card p-8">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label htmlFor="fp-email" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">EMAIL ADDRESS</label>
                <input
                  id="fp-email"
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
                disabled={loading || !isLoaded}
                className="btn-cyan w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Spinner size={16} /> SENDING…</> : 'SEND RESET CODE'}
              </button>

              <div className="text-center">
                <Link href="/auth/login" className="text-[#4A7FA5] text-sm hover:text-[#00D4FF] transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="fp-code" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">RESET CODE *</label>
                <input
                  id="fp-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  inputMode="numeric"
                  maxLength={6}
                  className="input-hud text-center tracking-[0.5em] text-lg"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="fp-newpass" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">NEW PASSWORD * (min 8 chars)</label>
                <input
                  id="fp-newpass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="input-hud"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6 || !isLoaded}
                className="btn-gold w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Spinner size={16} /> RESETTING…</> : 'RESET PASSWORD'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="font-mono text-xs text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                  className="font-mono text-xs text-[#00D4FF] hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
