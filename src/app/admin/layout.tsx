'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Users, TrendingUp, LogOut, Boxes, Tag, RotateCcw, MessageCircle, Settings, Star, Mail } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useClerk, useUser } from '@clerk/nextjs'
import { useAuthStore } from '@/store/auth.store'
import { PageLoading } from '@/components/ui'
import NotificationBell from '@/components/admin/NotificationBell'

const NAV = [
  { href: '/admin', label: 'DASHBOARD', icon: <LayoutDashboard size={16} />, exact: true },
  { href: '/admin/products',  label: 'PRODUCTS',  icon: <Package size={16} /> },
  { href: '/admin/inventory', label: 'INVENTORY', icon: <Boxes size={16} /> },
  { href: '/admin/orders',    label: 'ORDERS',    icon: <ShoppingBag size={16} /> },
  { href: '/admin/customers', label: 'CUSTOMERS', icon: <Users size={16} /> },
  { href: '/admin/analytics', label: 'ANALYTICS', icon: <TrendingUp size={16} /> },
  { href: '/admin/coupons',   label: 'COUPONS',   icon: <Tag size={16} /> },
  { href: '/admin/returns',   label: 'RETURNS',   icon: <RotateCcw size={16} /> },
  { href: '/admin/questions', label: 'Q&A',       icon: <MessageCircle size={16} /> },
  { href: '/admin/reviews',   label: 'REVIEWS',   icon: <Star size={16} /> },
  { href: '/admin/newsletter', label: 'NEWSLETTER', icon: <Mail size={16} /> },
  { href: '/admin/settings',  label: 'SETTINGS',  icon: <Settings size={16} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, _hasHydrated, logout: clearBackendAuth } = useAuthStore()
  const { isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const qc = useQueryClient()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!isLoaded || isLoginPage) return
    // Redirect to Clerk sign-in if not authenticated
    if (!isSignedIn) {
      router.push('/auth/login')
      return
    }
    // Wait for backend sync (ClerkSync populates _hasHydrated + isAdmin)
    if (_hasHydrated && !isAdmin) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, _hasHydrated, isAdmin, isLoginPage, router])

  // Admin login redirect to main login (admin uses same Clerk login)
  if (isLoginPage) return <>{children}</>

  // Not loaded yet or not admin
  if (!isLoaded || !isSignedIn || !_hasHydrated || !isAdmin) return <PageLoading />

  function handleLogout() {
    signOut()
    clearBackendAuth()
    qc.clear()
    router.push('/')
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 px-6 py-3 border-b border-[rgba(0,212,255,0.08)] bg-[#080C16] flex-shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
