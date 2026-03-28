'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, RotateCcw } from 'lucide-react'
import { useOrders } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { StatusBadge, EmptyState, PageLoading } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Order } from '@/types'

const STATUS_STEPS = ['PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrdersPage() {
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const { data: orders, isLoading, isFetching } = useOrders()
  const addItem = useCartStore((s) => s.addItem)

  function handleReorder(order: Order) {
    let added = 0
    for (const item of order.items) {
      const variant = item.variant
      if (!variant || !item.product) continue
      // Re-add only if variant is still active and in stock
      if (variant.is_active && variant.stock_qty > 0) {
        addItem(item.product as any, variant as any, item.qty)
        added++
      }
    }
    if (added > 0) toast.success(`${added} item${added > 1 ? 's' : ''} added to cart`)
    else toast.error('No in-stock items available to reorder')
  }

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) router.push('/auth/login')
  }, [_hasHydrated, isLoggedIn, router])

  // Show spinner while hydrating, loading, or refetching when we have no data yet
  if (!_hasHydrated || isLoading || (isFetching && !orders?.length)) return <PageLoading />

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">MY ORDERS</h1>
      <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

      {!orders || orders.length === 0 ? (
        <EmptyState
          icon={<Package size={56} />}
          title="No Orders Yet"
          description="Your order history will appear here."
          action={<Link href="/products" className="btn-gold px-8 py-3">SHOP NOW</Link>}
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const stepIdx = STATUS_STEPS.indexOf(order.status)
            return (
              <div key={order.id} className="hud-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-mono text-xs text-[#4A7FA5] mb-1">ORDER ID</p>
                    <p className="font-mono text-[#00D4FF]">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="font-mono text-xs text-[#4A7FA5] mt-1">{fmtDate(order.created_at)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-4">
                  {order.items.slice(0, 2).map((item) => (
                    <p key={item.id} className="text-sm text-[#E8F4FD]">
                      {item.product.name}
                      <span className="text-[#4A7FA5]"> × {item.qty}</span>
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-[#4A7FA5]">+{order.items.length - 2} more items</p>
                  )}
                </div>

                {/* Tracking timeline */}
                {order.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-0 mb-4">
                    {STATUS_STEPS.map((s, i) => {
                      const done = i <= stepIdx
                      const active = i === stepIdx
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 ${done ? 'border-[#00FF88] bg-[#00FF88]' : 'border-[rgba(0,212,255,0.3)]'} ${active ? 'animate-cyanglow' : ''}`} />
                            <p className={`font-mono text-[9px] mt-1 ${done ? 'text-[#00FF88]' : 'text-[#4A7FA5]'}`}>{s.split('')[0]+s.slice(1).toLowerCase()}</p>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${done && i < stepIdx ? 'bg-[#00FF88]' : 'bg-[rgba(0,212,255,0.15)]'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#FFB700] font-bold">{fmt(order.total)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#00D4FF] hover:text-[#00D4FF] font-mono text-xs rounded transition-all"
                    >
                      <RotateCcw size={12} /> REORDER
                    </button>
                    <Link href={`/account/orders/${order.id}`} className="btn-cyan text-xs">
                      VIEW DETAILS
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
