'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { useServerStore } from '@/store/server.store'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setUser, isAdmin, isLoggedIn } = useAuthStore()
  const serverReady = useServerStore((s) => s.serverReady)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Already logged in as admin → go straight to dashboard
  useEffect(() => {
    if (isLoggedIn && isAdmin) router.replace('/admin')
  }, [isLoggedIn, isAdmin, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      if (data.user.role !== 'ADMIN') {
        toast.error('Access denied — admin accounts only.')
        return
      }
      setUser(data.user, data.token)
      toast.success(`Welcome, ${data.user.name}!`)
      router.push('/admin')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; code?: string }
      const status = axiosErr?.response?.status
      const serverMsg = axiosErr?.response?.data?.message
      if (axiosErr?.code === 'ECONNABORTED' || !status) {
        toast.error('Server is starting up — please wait ~30 seconds and try again.', { duration: 8000 })
      } else if (status === 401 || status === 400) {
        toast.error(serverMsg || 'Invalid email or password.')
      } else if (status === 404) {
        toast.error('No admin account found with this email.')
      } else {
        toast.error(serverMsg || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hud-grid"
      style={{ background: '#080C16' }}>

      {/* faint cyan glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative">

        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4"
            style={{ border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.06)' }}>
            <ShieldCheck size={26} className="text-[#00D4FF]" />
          </div>
          <p className="font-heading text-2xl text-[#E8F4FD] tracking-[0.2em]">ADMIN ACCESS</p>
          <p className="font-mono text-[10px] text-[#4A7FA5] tracking-[0.3em] mt-1">N &amp; N AUDIO SYSTEMS</p>
          <div className="h-px w-12 bg-[#00D4FF] mx-auto mt-3 opacity-60" />
        </div>

        {/* Card */}
        <div className="hud-card p-7" style={{ background: 'rgba(13,27,42,0.95)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-[10px] text-[#4A7FA5] font-mono tracking-[0.2em] mb-1.5">
                ADMIN EMAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="input-hud"
                placeholder="admin@nnaudio.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#4A7FA5] font-mono tracking-[0.2em] mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="input-hud pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !serverReady}
              className="btn-cyan w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed font-heading tracking-widest"
            >
              {loading ? (
                <><Spinner size={15} /> AUTHENTICATING…</>
              ) : !serverReady ? (
                <><Spinner size={15} /> CONNECTING…</>
              ) : (
                <><Lock size={14} /> SIGN IN TO ADMIN</>
              )}
            </button>

            {!serverReady && (
              <p className="text-center text-[#4A7FA5] text-[10px] font-mono">
                Server waking up — please wait
              </p>
            )}
          </form>
        </div>

        {/* Back link */}
        <p className="text-center mt-5">
          <a href="/" className="font-mono text-[11px] text-[#4A7FA5] hover:text-[#00D4FF] tracking-wider transition-colors">
            ← BACK TO STOREFRONT
          </a>
        </p>
      </div>
    </div>
  )
}
