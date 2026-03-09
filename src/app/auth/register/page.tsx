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

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return
    setLoading(true)
    try {
      const { data } = await authApi.googleAuth(credentialResponse.credential)
      setUser(data.user, data.token)
      toast.success('Account created! Welcome to N & N Audio Systems.')
      router.push('/')
    } catch {
      toast.error('Google sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      const { data } = await authApi.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      setUser(data.user, data.token)
      toast.success('Account created! Welcome to N & N Audio Systems.')
      router.push('/')
    } catch {
      toast.error('Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
                className="input-hud"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Spinner size={16} /> CREATING ACCOUNT...</> : 'CREATE ACCOUNT'}
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
                onError={() => toast.error('Google sign-up failed')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signup_with"
                width="320"
              />
            </div>
          </div>

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
