'use client'
import { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ChevronLeft } from 'lucide-react'
import { useOrder } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import { PageLoading } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'

function InvoiceInner() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const { data: order, isLoading } = useOrder(id)

  // Auto-print when ?print=1 is in URL
  useEffect(() => {
    if (order && searchParams.get('print') === '1') {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [order, searchParams])

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) router.push('/auth/login')
  }, [_hasHydrated, isLoggedIn, router])

  if (!_hasHydrated || isLoading) return <PageLoading />
  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="font-heading text-2xl text-[#FF3366]">Order not found</p>
    </div>
  )

  const hasDiscount = (order.discount ?? 0) > 0

  return (
    <>
      {/* ── Screen-only controls ─────────────────────────── */}
      <div className="print:hidden max-w-3xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <Link
          href={`/account/orders/${id}`}
          className="flex items-center gap-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono text-sm"
        >
          <ChevronLeft size={16} /> BACK TO ORDER
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm font-heading tracking-widest"
        >
          <Printer size={16} /> PRINT / SAVE AS PDF
        </button>
      </div>

      {/* ── Invoice document ─────────────────────────────── */}
      <div
        id="invoice"
        className="
          max-w-3xl mx-auto px-8 py-8 mb-12
          print:max-w-none print:mx-0 print:px-10 print:py-8 print:mb-0
          bg-white text-black
          print:shadow-none shadow-xl rounded-lg
          border border-gray-200 print:border-0
        "
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-gray-900 mb-1">N &amp; N AUDIO SYSTEMS</h1>
            <p className="text-xs text-gray-500 tracking-wide">Precision Audio, Made in India</p>
            <p className="text-xs text-gray-500 mt-1">support@nnaudio.in</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 tracking-widest">TAX INVOICE</p>
            <p className="text-sm font-mono text-gray-600 mt-1">{order.order_number}</p>
            <p className="text-xs text-gray-500 mt-1">Date: {fmtDate(order.created_at)}</p>
          </div>
        </div>

        {/* Billing / Status row */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-500 tracking-widest mb-2">BILL TO</p>
            <p className="text-sm font-semibold text-gray-900">{order.address.name}</p>
            <p className="text-sm text-gray-600">{order.address.phone}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ''}
            </p>
            <p className="text-sm text-gray-600">
              {order.address.city}, {order.address.state} — {order.address.pin}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 tracking-widest mb-2">ORDER INFO</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-gray-900">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="font-semibold text-gray-900">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span className="font-semibold text-gray-900">{order.payment_status}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Coupon</span>
                  <span className="font-semibold text-gray-900">{order.coupon_code}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6 text-sm border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left px-4 py-3 font-semibold tracking-wider text-xs">#</th>
              <th className="text-left px-4 py-3 font-semibold tracking-wider text-xs">PRODUCT</th>
              <th className="text-left px-4 py-3 font-semibold tracking-wider text-xs">VARIANT</th>
              <th className="text-right px-4 py-3 font-semibold tracking-wider text-xs">QTY</th>
              <th className="text-right px-4 py-3 font-semibold tracking-wider text-xs">UNIT PRICE</th>
              <th className="text-right px-4 py-3 font-semibold tracking-wider text-xs">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{item.product.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.variant.label}</td>
                <td className="px-4 py-3 text-right text-gray-900">{item.qty}</td>
                <td className="px-4 py-3 text-right text-gray-900">{fmt(item.price)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="text-gray-900">{order.shipping === 0 ? 'FREE' : fmt(order.shipping)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-gray-500">Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span className="text-green-700">−{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 mt-1 border-t-2 border-gray-900">
              <span className="font-bold text-gray-900 tracking-wider">TOTAL</span>
              <span className="font-bold text-gray-900 text-lg">{fmt(order.total)}</span>
            </div>
            <p className="text-[10px] text-gray-400 text-right mt-1">All amounts in INR (₹). Inclusive of applicable taxes.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-5 text-center">
          <p className="text-sm font-semibold text-gray-900 tracking-wider mb-1">Thank you for your order!</p>
          <p className="text-xs text-gray-400">
            For support, contact support@nnaudio.in · This is a computer-generated invoice and does not require a signature.
          </p>
        </div>
      </div>
    </>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <InvoiceInner />
    </Suspense>
  )
}
