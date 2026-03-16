'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, Heart, Search } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/services/api'
import { cn } from '@/lib/utils'
import SearchBar from './SearchBar'

const NAV_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/products', label: 'PRODUCTS' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { count } = useCartStore()
  const wishlistCount = useWishlistStore((s) => s.count)
  const { isLoggedIn, isAdmin, logout } = useAuthStore()
  const qc = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  async function handleLogout() {
    try { await authApi.logout() } catch {}
    logout()
    qc.clear()
    router.push('/')
  }

  return (
    <nav className="print:hidden sticky top-0 z-50 border-b border-[rgba(0,212,255,0.12)] bg-[rgba(10,14,26,0.95)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 animate-cyanglow rounded">
          <div className="w-8 h-8 border border-[#00D4FF] rounded flex items-center justify-center">
            <span className="font-mono text-[#00D4FF] text-sm font-bold">N&N</span>
          </div>
          <span className="font-heading text-xl text-[#E8F4FD] tracking-widest hidden sm:block">
            AUDIO <span className="text-[#00D4FF]">SYSTEMS</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'font-heading text-sm tracking-widest transition-colors',
                pathname === l.href
                  ? 'text-[#00D4FF]'
                  : 'text-[#4A7FA5] hover:text-[#E8F4FD]'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          {/* Search toggle */}
          <button
            onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false) }}
            className={`p-2 transition-colors ${searchOpen ? 'text-[#00D4FF]' : 'text-[#4A7FA5] hover:text-[#00D4FF]'}`}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Wishlist */}
          <Link href="/account/wishlist" className="relative p-2 text-[#4A7FA5] hover:text-[#FF3366] transition-colors">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3366] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00D4FF] text-[#0A0E1A] text-[10px] font-bold flex items-center justify-center font-mono">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="p-2 text-[#4A7FA5] hover:text-[#FFB700] transition-colors hidden md:block">
                  <LayoutDashboard size={20} />
                </Link>
              )}
              <Link href="/account/profile" className="p-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors hidden md:block">
                <User size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-[#4A7FA5] hover:text-[#FF3366] transition-colors hidden md:block"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-cyan text-xs hidden md:block">
              LOGIN
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false) }}
            className="p-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search bar panel */}
      {searchOpen && (
        <div className="border-t border-[rgba(0,212,255,0.12)] bg-[rgba(10,14,26,0.98)] px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[rgba(0,212,255,0.12)] bg-[#0D1B2A] px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'font-heading text-sm tracking-widest',
                pathname === l.href ? 'text-[#00D4FF]' : 'text-[#4A7FA5]'
              )}
            >
              {l.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="font-heading text-sm tracking-widest text-[#FFB700]">
                  ADMIN
                </Link>
              )}
              <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="font-heading text-sm tracking-widest text-[#4A7FA5]">
                PROFILE
              </Link>
              <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="font-heading text-sm tracking-widest text-[#4A7FA5]">
                MY ORDERS
              </Link>
              <Link href="/account/wishlist" onClick={() => setMenuOpen(false)} className="font-heading text-sm tracking-widest text-[#4A7FA5] flex items-center gap-2">
                WISHLIST {wishlistCount > 0 && <span className="text-[#FF3366]">({wishlistCount})</span>}
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-left font-heading text-sm tracking-widest text-[#FF3366]">
                LOGOUT
              </button>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-cyan text-center">
              LOGIN
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
