'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useSignUp } from '@clerk/nextjs'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

type Step = 'form' | 'verify'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [code, setCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    if (!agreedToTerms) {
      toast.error('Please accept the Terms & Conditions to continue')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const nameParts = form.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || undefined

      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName,
        lastName,
        // Store phone in unsafeMetadata — passed to backend during clerk-sync
        unsafeMetadata: { phone: form.phone },
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
      toast.success('Verification code sent to your email!')
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; code: string }> }
      const code = clerkErr?.errors?.[0]?.code
      const msg = clerkErr?.errors?.[0]?.message

      if (code === 'form_identifier_exists') {
        toast.error('An account with this email already exists.')
      } else if (code === 'form_password_pwned') {
        toast.error('This password has appeared in data breaches. Please choose a stronger password.')
      } else {
        toast.error(msg || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // ClerkSync fires automatically to sync backend JWT
        toast.success('Account created! Welcome to N & N Audio Systems.')
        router.push('/')
      } else {
        toast.error('Verification incomplete. Please try again.')
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; code: string }> }
      const errCode = clerkErr?.errors?.[0]?.code
      const msg = clerkErr?.errors?.[0]?.message
      if (errCode === 'form_code_incorrect') {
        toast.error('Incorrect code. Please check your email and try again.')
      } else if (errCode === 'verification_expired') {
        toast.error('Code expired. Please go back and resend.')
      } else {
        toast.error(msg || 'Verification failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!isLoaded) return
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      toast.success('New code sent!')
    } catch {
      toast.error('Could not resend code. Please try again.')
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">VERIFY EMAIL</div>
            <div className="h-0.5 w-10 bg-[#00FF88] mx-auto mt-3" />
            <p className="text-[#4A7FA5] text-sm mt-3">
              Enter the 6-digit code sent to <span className="text-[#00D4FF]">{form.email}</span>
            </p>
          </div>

          <div className="hud-card p-8">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="verify-code" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">VERIFICATION CODE *</label>
                <input
                  id="verify-code"
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

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="btn-gold w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Spinner size={16} /> VERIFYING…</> : 'VERIFY & CREATE ACCOUNT'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="font-mono text-xs text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="font-mono text-xs text-[#00D4FF] hover:underline"
              >
                Resend code
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">CREATE ACCOUNT</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Join the N &amp; N Audio community</p>
        </div>

        <div className="hud-card p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">FULL NAME *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-hud" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">EMAIL *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-hud" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">PHONE *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className="input-hud" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">PASSWORD * (min 8 chars)</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="input-hud pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors"
                >
                  {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">CONFIRM PASSWORD *</label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                required
                aria-invalid={form.confirm.length > 0 && form.password !== form.confirm}
                aria-describedby="confirm-hint"
                className="input-hud"
                placeholder="••••••••"
              />
              {form.confirm.length > 0 && (
                <p id="confirm-hint" className={`mt-1 font-mono text-[10px] ${form.password === form.confirm ? 'text-[#00FF88]' : 'text-[#FF3366]'}`}>
                  {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border border-[rgba(0,212,255,0.4)] bg-transparent accent-[#00D4FF] cursor-pointer flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs text-[#4A7FA5] font-mono leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link href="/policies/terms" className="text-[#00D4FF] hover:underline">Terms &amp; Conditions</Link>
                {' '}and{' '}
                <Link href="/policies/privacy" className="text-[#00D4FF] hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms || !isLoaded}
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><Spinner size={16} /> CREATING ACCOUNT…</> : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#4A7FA5] text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#00D4FF] hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
