'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Users, TrendingUp, LogOut, Boxes } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { PageLoading } from '@/components/ui'

const NAV = [
  { href: '/admin', label: 'DASHBOARD', icon: <LayoutDashboard size={16} />, exact: true },
  { href: '/admin/products',  label: 'PRODUCTS',  icon: <Package size={16} /> },
  { href: '/admin/inventory', label: 'INVENTORY', icon: <Boxes size={16} /> },
  { href: '/admin/orders',    label: 'ORDERS',    icon: <ShoppingBag size={16} /> },
  { href: '/admin/customers', label: 'CUSTOMERS', icon: <Users size={16} /> },
  { href: '/admin/analytics', label: 'ANALYTICS', icon: <TrendingUp size={16} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, isLoggedIn, _hasHydrated, logout } = useAuthStore()
  const qc = useQueryClient()

  // ── /admin/login is inside this layout but must NOT be guarded ──
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!_hasHydrated || isLoginPage) return
    if (!isLoggedIn) {
      router.push('/admin/login')
    } else if (!isAdmin) {
      router.push('/')
    }
  }, [_hasHydrated, isAdmin, isLoggedIn, isLoginPage, router])

  // Render login page without sidebar chrome
  if (isLoginPage) return <>{children}</>

  // Wait for hydration or auth check
  if (!_hasHydrated || !isAdmin) return <PageLoading />

  function handleLogout() {
    logout()
    qc.clear()
    router.push('/admin/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[rgba(0,212,255,0.12)] bg-[#080C16] flex flex-col">
        <div className="px-5 py-6 border-b border-[rgba(0,212,255,0.12)]">
          <Link href="/admin" className="font-heading text-sm text-[#00D4FF] tracking-widest">
            N &amp; N AUDIO
          </Link>
          <p className="font-mono text-[9px] text-[#4A7FA5] mt-0.5 tracking-widest">ADMIN PANEL</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded font-mono text-xs tracking-widest transition-all ${
                  active
                    ? 'bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.25)]'
                    : 'text-[#4A7FA5] hover:text-[#E8F4FD] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-5">
          <Link href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors tracking-widest">
            ← STOREFRONT
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs text-[#FF3366] hover:text-white hover:bg-[rgba(255,51,102,0.1)] rounded transition-all tracking-widest">
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
