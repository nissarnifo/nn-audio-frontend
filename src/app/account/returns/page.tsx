'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RotateCcw, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { useMyReturns } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import { EmptyState, PageLoading } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useEffect } from 'react'
import type { ReturnStatus } from '@/types'

const STATUS_COLOR: Record<ReturnStatus, string> = {
  REQUESTED: '#FFB700',
  APPROVED: '#00D4FF',
  REJECTED: '#FF3366',
  REFUNDED: '#00FF88',
}

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
}

const STATUS_ICON: Record<ReturnStatus, React.ReactNode> = {
  REQUESTED: <Clock size={10} aria-hidden="true" />,
  APPROVED: <CheckCircle2 size={10} aria-hidden="true" />,
  REJECTED: <XCircle size={10} aria-hidden="true" />,
  REFUNDED: <RefreshCw size={10} aria-hidden="true" />,
}

export default function MyReturnsPage() {
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const { data: returns, isLoading } = useMyReturns()

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) router.push('/auth/login')
  }, [_hasHydrated, isLoggedIn, router])

  if (!_hasHydrated || isLoading) return <PageLoading />

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">MY RETURNS</h1>
      <div className="h-0.5 w-10 bg-[#FFB700] mb-8" />

      {!returns || returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw size={56} />}
          title="No Return Requests"
          description="Delivered orders can be returned within 30 days."
          action={<Link href="/account/orders" className="btn-cyan px-8 py-3">VIEW ORDERS</Link>}
        />
      ) : (
        <div className="space-y-5">
          {returns.map((r) => (
            <div key={r.id} className="hud-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-mono text-xs text-[#4A7FA5] mb-0.5">ORDER</p>
                  <p className="font-mono text-[#00D4FF]">{r.order_number}</p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full border"
                    style={{ color: STATUS_COLOR[r.status], borderColor: `${STATUS_COLOR[r.status]}40`, background: `${STATUS_COLOR[r.status]}10` }}
                  >
                    {STATUS_ICON[r.status]}
                    {STATUS_LABEL[r.status]}
                  </span>
                  <p className="font-mono text-xs text-[#4A7FA5] mt-1.5">{fmtDate(r.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <p className="font-mono text-[10px] text-[#4A7FA5] mb-0.5">ORDER TOTAL</p>
                  <p className="font-mono text-[#FFB700]">{fmt(r.order_total)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#4A7FA5] mb-0.5">ORDER DATE</p>
                  <p className="font-mono text-[#E8F4FD]">{fmtDate(r.order_date)}</p>
                </div>
              </div>

              <div className="mb-2">
                <p className="font-mono text-[10px] text-[#4A7FA5] mb-0.5">REASON</p>
                <p className="font-mono text-sm text-[#E8F4FD]">{r.reason}</p>
              </div>

              {r.notes && (
                <p className="font-mono text-xs text-[#4A7FA5] mb-2">Notes: {r.notes}</p>
              )}

              {r.admin_note && (
                <div className="mt-3 p-3 bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.12)] rounded">
                  <p className="font-mono text-[10px] text-[#4A7FA5] mb-0.5">ADMIN RESPONSE</p>
                  <p className="font-mono text-xs text-[#E8F4FD]">{r.admin_note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
