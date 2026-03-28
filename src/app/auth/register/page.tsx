'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useSignUp } from '@clerk/nextjs'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

type Step = 'form' | 'verify'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [code, setCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleOAuth(provider: 'oauth_google' | 'oauth_github') {
    if (!isLoaded || !signUp) return
    setOauthLoading(provider === 'oauth_google' ? 'google' : 'github')
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      })
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> }
      toast.error(clerkErr?.errors?.[0]?.message || 'OAuth sign up failed.')
      setOauthLoading(null)
    }
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
        unsafeMetadata: { phone: form.phone },
      })

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
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('oauth_google')}
              disabled={!isLoaded || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] hover:bg-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.4)] text-[#E8F4FD] font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? <Spinner size={16} /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('oauth_github')}
              disabled={!isLoaded || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] hover:bg-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.4)] text-[#E8F4FD] font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? <Spinner size={16} /> : <GitHubIcon />}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-1 border-t border-[rgba(0,212,255,0.15)]" />
            <span className="mx-4 text-[#4A7FA5] font-mono text-xs">OR</span>
            <div className="flex-1 border-t border-[rgba(0,212,255,0.15)]" />
          </div>

          {/* Email/Password Form */}
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
