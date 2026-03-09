'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return
    setLoading(true)
    try {
      const { data } = await authApi.googleAuth(credentialResponse.credential)
      setUser(data.user, data.token)
      toast.success(`Welcome, ${data.user.name}!`)
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch {
      toast.error('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      setUser(data.user, data.token)
      toast.success(`Welcome back, ${data.user.name}!`)
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">SIGN IN</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Access your N &amp; N Audio account</p>
        </div>

        <div className="hud-card p-8">
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
              <label className="block text-xs text-[#4A7FA5] font-mono mb-1.5">PASSWORD</label>
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
              disabled={loading}
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Spinner size={16} /> SIGNING IN...</> : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[rgba(0,212,255,0.15)]" />
              <span className="text-[#4A7FA5] text-xs font-mono">OR</span>
              <div className="flex-1 h-px bg-[rgba(0,212,255,0.15)]" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
                width="320"
              />
            </div>
          </div>

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
