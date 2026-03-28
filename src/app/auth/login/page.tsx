'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useSignIn } from '@clerk/nextjs'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPath = searchParams.get('from')
  const { signIn, setActive, isLoaded } = useSignIn()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // ClerkSync will fire automatically and sync the backend JWT
        router.push(fromPath ?? '/')
      } else {
        toast.error('Additional verification required. Please try again.')
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; code: string }> }
      const code = clerkErr?.errors?.[0]?.code
      const msg = clerkErr?.errors?.[0]?.message

      if (code === 'form_identifier_not_found') {
        toast.error('No account found with this email.')
      } else if (code === 'form_password_incorrect') {
        toast.error('Incorrect password. Please try again.')
      } else if (code === 'too_many_requests') {
        toast.error('Too many attempts — please wait a moment.')
      } else {
        toast.error(msg || 'Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">SIGN IN</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Welcome back to N &amp; N Audio Systems</p>
        </div>

        <div className="hud-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">EMAIL *</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="input-hud"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs text-[#4A7FA5] font-mono mb-1.5">PASSWORD *</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
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

            <div className="text-right">
              <Link href="/auth/forgot-password" className="font-mono text-xs text-[#4A7FA5] hover:text-[#00D4FF] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="btn-cyan w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><Spinner size={16} /> SIGNING IN…</> : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#4A7FA5] text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-[#00D4FF] hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
