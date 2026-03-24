'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, RotateCcw, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCcw } from 'lucide-react'
import { useOrder, useCancelOrder, useSubmitReturn, useMyReturns } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { StatusBadge, PageLoading, Divider, Spinner } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

/* ── Order status timeline ────────────────────────────────────────── */
type StepStatus = 'done' | 'active' | 'pending'

interface Step {
  label: string
  icon: React.ReactNode
  status: StepStatus
}

function OrderTimeline({ status }: { status: string }) {
  const isCancelled = status === 'CANCELLED'
  const isReturned  = status === 'RETURNED'

  if (isCancelled) {
    return (
      <div className="hud-card p-5 mb-4 border border-[rgba(255,51,102,0.2)] bg-[rgba(255,51,102,0.03)]">
        <div className="flex items-center gap-3">
          <XCircle size={20} className="text-[#FF3366] flex-shrink-0" />
          <div>
            <p className="font-heading text-sm text-[#FF3366] tracking-wider">ORDER CANCELLED</p>
            <p className="font-mono text-xs text-[#4A7FA5] mt-0.5">This order has been cancelled and will not be shipped.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isReturned) {
    return (
      <div className="hud-card p-5 mb-4 border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.03)]">
        <div className="flex items-center gap-3">
          <RefreshCcw size={20} className="text-[#00D4FF] flex-shrink-0" />
          <div>
            <p className="font-heading text-sm text-[#00D4FF] tracking-wider">ORDER RETURNED</p>
            <p className="font-mono text-xs text-[#4A7FA5] mt-0.5">Return processed. Refund will be credited within 5–7 business days.</p>
          </div>
        </div>
      </div>
    )
  }

  const ORDER_STEPS = ['PROCESSING', 'SHIPPED', 'DELIVERED']
  const currentIdx = ORDER_STEPS.indexOf(status)

  const steps: Step[] = [
    {
      label: 'Order Placed',
      icon: <Clock size={15} />,
      status: currentIdx >= 0 ? 'done' : 'pending',
    },
    {
      label: 'Processing',
      icon: <Package size={15} />,
      status: currentIdx > 0 ? 'done' : currentIdx === 0 ? 'active' : 'pending',
    },
    {
      label: 'Shipped',
      icon: <Truck size={15} />,
      status: currentIdx > 1 ? 'done' : currentIdx === 1 ? 'active' : 'pending',
    },
    {
      label: 'Delivered',
      icon: <CheckCircle2 size={15} />,
      status: currentIdx >= 2 ? 'done' : 'pending',
    },
  ]

  return (
    <div className="hud-card p-5 mb-4">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-[rgba(0,212,255,0.1)] mx-8" />
        {steps.map((step, i) => {
          const isDone   = step.status === 'done'
          const isActive = step.status === 'active'
          return (
            <div key={i} className="relative flex flex-col items-center gap-2 flex-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors border ${
                  isDone
                    ? 'bg-[#00FF88] border-[#00FF88] text-[#0A0E1A]'
                    : isActive
                    ? 'bg-[rgba(0,212,255,0.15)] border-[#00D4FF] text-[#00D4FF] animate-pulse'
                    : 'bg-[rgba(0,212,255,0.05)] border-[rgba(0,212,255,0.15)] text-[rgba(74,127,165,0.5)]'
                }`}
              >
                {step.icon}
              </div>
              {/* Label */}
              <span
                className={`font-mono text-[10px] tracking-wide text-center leading-tight ${
                  isDone ? 'text-[#00FF88]' : isActive ? 'text-[#00D4FF]' : 'text-[rgba(74,127,165,0.5)]'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RETURN_REASONS = [
  'Defective / not working',
  'Wrong item received',
  'Item not as described',
  'Damaged during shipping',
  'Other',
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const { data: order, isLoading, isFetching } = useOrder(id)
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder()
  const { mutate: submitReturn, isPending: isSubmittingReturn } = useSubmitReturn()
  const { data: myReturns } = useMyReturns()
  const addItem = useCartStore((s) => s.addItem)

  function handleReorder() {
    if (!order) return
    let added = 0
    for (const item of order.items) {
      if (item.variant?.is_active && item.variant.stock_qty > 0) {
        addItem(item.product as any, item.variant as any, item.qty)
        added++
      }
    }
    if (added > 0) toast.success(`${added} item${added > 1 ? 's' : ''} added to cart`)
    else toast.error('No in-stock items available to reorder')
  }
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0])
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) router.push('/auth/login')
  }, [_hasHydrated, isLoggedIn, router])

  if (!_hasHydrated || isLoading || (isFetching && !order)) return <PageLoading />
  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="font-heading text-2xl text-[#FF3366]">Order not found</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mb-6 font-mono text-sm">
        <ChevronLeft size={16} /> MY ORDERS
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider">{order.order_number}</h1>
          <p className="font-mono text-xs text-[#4A7FA5] mt-1">Placed on {fmtDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button
            onClick={handleReorder}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#00D4FF] hover:text-[#00D4FF] font-mono text-xs rounded transition-all"
          >
            <RotateCcw size={13} /> REORDER
          </button>
          <Link
            href={`/account/orders/${order.id}/invoice`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#00D4FF] hover:text-[#00D4FF] font-mono text-xs rounded transition-all"
          >
            <FileText size={13} /> INVOICE
          </Link>
        </div>
      </div>

      {/* Status timeline */}
      <OrderTimeline status={order.status} />

      {/* Items */}
      <div className="hud-card p-6 mb-4">
        <h2 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-4">ORDER ITEMS</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#E8F4FD]">{item.product.name}</p>
                <p className="text-xs text-[#4A7FA5] mt-0.5">{item.variant.label} × {item.qty}</p>
              </div>
              <span className="font-mono text-[#FFB700] text-sm">{fmt(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <Divider className="my-4" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#4A7FA5] font-mono">Subtotal</span>
            <span className="font-mono text-[#E8F4FD]">{fmt(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4A7FA5] font-mono">Shipping</span>
            <span className={`font-mono ${order.shipping === 0 ? 'text-[#00FF88]' : 'text-[#E8F4FD]'}`}>{order.shipping === 0 ? 'FREE' : fmt(order.shipping)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-[#00FF88] font-mono">Discount {order.coupon_code && `(${order.coupon_code})`}</span>
              <span className="font-mono text-[#00FF88]">−{fmt(order.discount)}</span>
            </div>
          )}
        </div>
        <Divider className="my-4" />
        <div className="flex justify-between">
          <span className="font-heading text-base text-[#E8F4FD]">TOTAL</span>
          <span className="font-mono text-lg text-[#FFB700] font-bold">{fmt(order.total)}</span>
        </div>
      </div>

      {/* Tracking info — shown when order is shipped and tracking data exists */}
      {order.status === 'SHIPPED' && (order.tracking_number || order.tracking_url) && (
        <div className="hud-card p-6 mb-4 border border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.03)]">
          <h2 className="font-heading text-base text-[#00FF88] tracking-wider mb-3 flex items-center gap-2">
            <RotateCcw size={15} className="rotate-0" />
            SHIPMENT TRACKING
          </h2>
          {order.tracking_number && (
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-xs text-[#4A7FA5]">Tracking Number</span>
              <span className="font-mono text-sm text-[#E8F4FD]">{order.tracking_number}</span>
            </div>
          )}
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 btn-gold font-heading text-sm tracking-widest"
            >
              TRACK MY PACKAGE →
            </a>
          )}
        </div>
      )}

      {/* Delivery notes */}
      {order.notes && (
        <div className="hud-card p-6 mb-4 border border-[rgba(255,183,0,0.2)] bg-[rgba(255,183,0,0.02)]">
          <h2 className="font-heading text-base text-[#FFB700] tracking-wider mb-2">DELIVERY NOTES</h2>
          <p className="text-sm text-[#E8F4FD] leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Address */}
      <div className="hud-card p-6 mb-4">
        <h2 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-3">DELIVERY ADDRESS</h2>
        <p className="text-sm text-[#E8F4FD]">{order.address.name}</p>
        <p className="text-sm text-[#4A7FA5]">{order.address.phone}</p>
        <p className="text-sm text-[#4A7FA5] mt-1">
          {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''},<br />
          {order.address.city}, {order.address.state} - {order.address.pin}
        </p>
      </div>

      {/* Payment */}
      <div className="hud-card p-6">
        <h2 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-3">PAYMENT INFO</h2>
        <div className="flex justify-between text-sm">
          <span className="text-[#4A7FA5] font-mono">Method</span>
          <span className="font-mono text-[#E8F4FD]">{order.payment_method}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-[#4A7FA5] font-mono">Status</span>
          <span className={`font-mono ${order.payment_status === 'PAID' ? 'text-[#00FF88]' : order.payment_status === 'FAILED' ? 'text-[#FF3366]' : 'text-[#FFB700]'}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      {/* P3: Cancel order — only available while PROCESSING */}
      {order.status === 'PROCESSING' && (
        <div className="hud-card p-5 mt-4">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full font-mono text-sm text-[#FF3366] border border-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] transition-colors py-2.5 rounded"
            >
              CANCEL ORDER
            </button>
          ) : (
            <div>
              <p className="font-mono text-sm text-[#E8F4FD] mb-4 text-center">
                Are you sure you want to cancel this order?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="btn-cyan flex-1"
                >
                  KEEP ORDER
                </button>
                <button
                  onClick={() => cancelOrder(order.id)}
                  disabled={isCancelling}
                  className="flex-1 font-mono text-sm text-[#FF3366] border border-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] transition-colors py-2.5 rounded flex items-center justify-center gap-2"
                >
                  {isCancelling ? <><Spinner size={14} /> CANCELLING...</> : 'YES, CANCEL'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* P17: Request Return — available 30 days after DELIVERED */}
      {order.status === 'DELIVERED' && (() => {
        const existingReturn = myReturns?.find((r) => r.order_number === order.order_number)
        if (existingReturn) {
          const colors: Record<string, string> = {
            REQUESTED: '#FFB700', APPROVED: '#00FF88', REJECTED: '#FF3366', REFUNDED: '#00D4FF',
          }
          return (
            <div className="hud-card p-5 mt-4 border border-[rgba(255,183,0,0.2)]">
              <p className="font-mono text-sm text-[#4A7FA5] mb-1">RETURN REQUEST</p>
              <p className="font-mono text-xs" style={{ color: colors[existingReturn.status] ?? '#E8F4FD' }}>
                ● {existingReturn.status}
              </p>
              {existingReturn.admin_note && (
                <p className="font-mono text-xs text-[#E8F4FD] mt-2">Admin: {existingReturn.admin_note}</p>
              )}
            </div>
          )
        }

        const daysSince = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince > 7) return null

        return (
          <div className="hud-card p-5 mt-4">
            {!showReturnForm ? (
              <button
                onClick={() => setShowReturnForm(true)}
                className="w-full flex items-center justify-center gap-2 font-mono text-sm text-[#FFB700] border border-[rgba(255,183,0,0.4)] hover:bg-[rgba(255,183,0,0.06)] transition-colors py-2.5 rounded"
              >
                <RotateCcw size={14} /> REQUEST RETURN
              </button>
            ) : (
              <div>
                <p className="font-heading text-sm text-[#E8F4FD] tracking-wider mb-4">RETURN REQUEST</p>
                <div className="mb-3">
                  <label className="font-mono text-xs text-[#4A7FA5] mb-1 block">REASON</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-[#00D4FF]"
                  >
                    {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="font-mono text-xs text-[#4A7FA5] mb-1 block">ADDITIONAL NOTES (optional)</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-[#00D4FF] resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReturnForm(false)} className="btn-cyan flex-1">CANCEL</button>
                  <button
                    onClick={() => submitReturn(
                      { orderId: order.id, reason: returnReason, notes: returnNotes || undefined },
                      { onSuccess: () => setShowReturnForm(false) }
                    )}
                    disabled={isSubmittingReturn}
                    className="flex-1 flex items-center justify-center gap-2 font-mono text-sm text-[#FFB700] border border-[rgba(255,183,0,0.5)] hover:bg-[rgba(255,183,0,0.08)] transition-colors py-2.5 rounded"
                  >
                    {isSubmittingReturn ? <><Spinner size={14} /> SUBMITTING...</> : 'SUBMIT RETURN'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      <div className="mt-6">
        <Link href="/account/orders" className="btn-cyan">← BACK TO ORDERS</Link>
      </div>
    </div>
  )
}
