'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { useServerStore } from '@/store/server.store'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

const ALL_PROVIDERS = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
]

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const serverReady = useServerStore((s) => s.serverReady)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [enabledProviders, setEnabledProviders] = useState<string[]>([])

  // Fetch which OAuth providers are actually configured on the server
  useEffect(() => {
    fetch('/api/auth/available-providers')
      .then((r) => r.json())
      .then((d) => setEnabledProviders(d.providers ?? []))
      .catch(() => setEnabledProviders([]))
  }, [])

  // Show error from NextAuth redirect (e.g. provider not configured)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      if (error === 'OAuthAccountNotLinked') {
        toast.error('This email is already registered with a different sign-in method.')
      } else if (error === 'Configuration') {
        toast.error('OAuth provider is not configured. Please use email & password.')
      } else {
        toast.error('Sign-in failed. Please use email & password instead.')
      }
    }
  }, [])

  const socialProviders = ALL_PROVIDERS.filter((p) => enabledProviders.includes(p.id))

  async function handleOAuth(provider: string) {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: '/' })
    setOauthLoading(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      setUser(data.user, data.token)
      toast.success(`Welcome back, ${data.user.name}!`)
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; code?: string }
      const status = axiosErr?.response?.status
      const serverMsg = axiosErr?.response?.data?.message
      const isTimeout = axiosErr?.code === 'ECONNABORTED'

      if (isTimeout) {
        toast.error('Server is waking up — please wait 30 seconds and try again. (Render free tier cold start)', { duration: 6000 })
      } else if (status === 401 || status === 400) {
        toast.error(serverMsg || 'Invalid email or password.')
      } else if (status === 404) {
        toast.error('No account found with this email. Please register first.')
      } else if (status === 500) {
        toast.error('Server error — please try again in a moment.')
      } else if (!status) {
        toast.error('Server is starting up — please wait ~30 seconds and try again.', { duration: 8000 })
      } else {
        toast.error(serverMsg || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 pb-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">SIGN IN</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Access your N &amp; N Audio account</p>
        </div>

        <div className="hud-card p-8">
          {/* Social login */}
          {socialProviders.length > 0 && (
            <>
              <div className="space-y-3 mb-6">
                {socialProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleOAuth(p.id)}
                    disabled={!!oauthLoading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] text-[#E8F4FD] hover:border-[rgba(0,212,255,0.5)] hover:bg-[rgba(0,212,255,0.08)] transition-all font-mono text-sm"
                  >
                    {oauthLoading === p.id ? <Spinner size={18} /> : p.icon}
                    Continue with {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[rgba(0,212,255,0.15)]" />
                <span className="text-[#4A7FA5] text-xs font-mono">OR</span>
                <div className="flex-1 h-px bg-[rgba(0,212,255,0.15)]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">EMAIL ADDRESS</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="input-hud"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#4A7FA5] font-mono">PASSWORD</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#00D4FF] hover:underline font-mono">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  className="input-hud pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading || !serverReady}
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Spinner size={16} /> SIGNING IN...</>
              ) : !serverReady ? (
                <><Spinner size={16} /> CONNECTING TO SERVER…</>
              ) : (
                'SIGN IN'
              )}
            </button>
            {!serverReady && (
              <p className="text-center text-[#4A7FA5] text-xs font-mono mt-1">
                Server is waking up — form will unlock shortly
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#4A7FA5] text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-[#00D4FF] hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
