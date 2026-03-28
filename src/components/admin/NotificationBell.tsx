'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bell, ShoppingBag, RotateCcw, MessageCircle, Package } from 'lucide-react'
import { useAdminNotifications } from '@/hooks'

interface NotifItem {
  icon: React.ReactNode
  label: string
  count: number
  href: string
  color: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data } = useAdminNotifications()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const total = data?.total ?? 0

  const items: NotifItem[] = [
    {
      icon: <ShoppingBag size={13} />,
      label: 'New orders (24h)',
      count: data?.new_orders ?? 0,
      href: '/admin/orders',
      color: '#00D4FF',
    },
    {
      icon: <RotateCcw size={13} />,
      label: 'Pending returns',
      count: data?.pending_returns ?? 0,
      href: '/admin/returns',
      color: '#FFB700',
    },
    {
      icon: <MessageCircle size={13} />,
      label: 'Unanswered Q&A',
      count: data?.unanswered_questions ?? 0,
      href: '/admin/questions',
      color: '#00FF88',
    },
    {
      icon: <Package size={13} />,
      label: 'Low stock variants',
      count: data?.low_stock_variants ?? 0,
      href: '/admin/inventory',
      color: '#FF3366',
    },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded text-[#4A7FA5] hover:text-[#00D4FF] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#FF3366] font-mono text-[9px] text-white px-0.5 leading-none">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 hud-card shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(0,212,255,0.1)]">
            <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest">NOTIFICATIONS</p>
          </div>

          {total === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="font-mono text-xs text-[#4A7FA5]">All clear!</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(0,212,255,0.06)]">
              {items.map((item) => {
                if (item.count === 0) return null
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[rgba(0,212,255,0.03)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5" style={{ color: item.color }}>
                      {item.icon}
                      <span className="font-mono text-xs text-[#E8F4FD]">{item.label}</span>
                    </div>
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}40` }}
                    >
                      {item.count}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
