'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Mail, Phone, Calendar, ShoppingBag, RotateCcw, Star, TrendingUp } from 'lucide-react'
import { useAdminCustomer } from '@/hooks'
import { PageLoading, StatusBadge, Spinner } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'

const RETURN_COLOR: Record<string, string> = {
  REQUESTED: '#FFB700', APPROVED: '#00D4FF', REJECTED: '#FF3366', REFUNDED: '#00FF88',
}

function StatCard({ icon: Icon, label, value, color = '#00D4FF' }: {
  icon: React.ElementType; label: string; value: string; color?: string
}) {
  return (
    <div className="hud-card p-5 flex items-start gap-3">
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p className="font-mono text-xl font-bold text-[#E8F4FD]">{value}</p>
        <p className="font-mono text-[10px] text-[#4A7FA5] mt-0.5 tracking-widest">{label}</p>
      </div>
    </div>
  )
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: customer, isLoading } = useAdminCustomer(id)

  if (isLoading) return <PageLoading />
  if (!customer) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <p className="font-heading text-2xl text-[#FF3366]">Customer not found</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mb-6 font-mono text-sm"
      >
        <ChevronLeft size={16} /> CUSTOMERS
      </button>

      {/* Header */}
      <div className="hud-card p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#4A7FA5]">
                <Mail size={12} /> {customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1.5 font-mono text-xs text-[#4A7FA5]">
                  <Phone size={12} /> {customer.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#4A7FA5]">
                <Calendar size={12} /> Joined {fmtDate(customer.created_at)}
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] px-3 py-1 rounded-full border border-[rgba(0,212,255,0.3)] text-[#00D4FF]">
            {customer.role}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="LIFETIME SPEND" value={fmt(customer.stats.total_spend)} color="#FFB700" />
        <StatCard icon={TrendingUp} label="AVG ORDER" value={fmt(customer.stats.avg_order_value)} color="#00D4FF" />
        <StatCard icon={ShoppingBag} label="ORDERS" value={String(customer.stats.order_count)} color="#00FF88" />
        <StatCard icon={RotateCcw} label="RETURNS" value={String(customer.stats.return_count)} color="#FF3366" />
        <StatCard icon={Star} label="REVIEWS" value={String(customer.stats.review_count)} color="#FFB700" />
      </div>

      {/* Orders */}
      <div className="hud-card mb-6">
        <div className="p-5 border-b border-[rgba(0,212,255,0.1)]">
          <h2 className="font-heading text-sm text-[#E8F4FD] tracking-widest flex items-center gap-2">
            <ShoppingBag size={14} className="text-[#00D4FF]" /> ORDERS
          </h2>
        </div>
        {customer.orders.length === 0 ? (
          <p className="p-5 font-mono text-sm text-[#4A7FA5]">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.08)]">
                  {['ORDER #', 'STATUS', 'ITEMS', 'TOTAL', 'DATE'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr key={o.id} className="border-b border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm text-[#00D4FF]">{o.order_number}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 font-mono text-sm text-[#E8F4FD]">{o.item_count}</td>
                    <td className="px-5 py-3 font-mono text-sm text-[#FFB700]">{fmt(o.total)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#4A7FA5]">{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Returns */}
      {customer.returns.length > 0 && (
        <div className="hud-card mb-6">
          <div className="p-5 border-b border-[rgba(0,212,255,0.1)]">
            <h2 className="font-heading text-sm text-[#E8F4FD] tracking-widest flex items-center gap-2">
              <RotateCcw size={14} className="text-[#FFB700]" /> RETURNS
            </h2>
          </div>
          <div className="divide-y divide-[rgba(0,212,255,0.06)]">
            {customer.returns.map((r) => (
              <div key={r.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-[#00D4FF]">{r.order_number}</p>
                  <p className="font-mono text-xs text-[#E8F4FD] mt-1">{r.reason}</p>
                  {r.admin_note && <p className="font-mono text-xs text-[#4A7FA5] mt-0.5">Note: {r.admin_note}</p>}
                </div>
                <div className="text-right">
                  <span
                    className="font-mono text-[10px] px-2.5 py-1 rounded-full border"
                    style={{ color: RETURN_COLOR[r.status] ?? '#4A7FA5', borderColor: `${RETURN_COLOR[r.status] ?? '#4A7FA5'}40`, background: `${RETURN_COLOR[r.status] ?? '#4A7FA5'}10` }}
                  >
                    {r.status}
                  </span>
                  <p className="font-mono text-xs text-[#4A7FA5] mt-1">{fmtDate(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {customer.reviews.length > 0 && (
        <div className="hud-card">
          <div className="p-5 border-b border-[rgba(0,212,255,0.1)]">
            <h2 className="font-heading text-sm text-[#E8F4FD] tracking-widest flex items-center gap-2">
              <Star size={14} className="text-[#FFB700]" /> REVIEWS
            </h2>
          </div>
          <div className="divide-y divide-[rgba(0,212,255,0.06)]">
            {customer.reviews.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <Link href={`/products/${r.product_slug}`} target="_blank" className="font-mono text-sm text-[#00D4FF] hover:underline">
                    {r.product_name}
                  </Link>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} className={i < r.rating ? 'fill-[#FFB700] text-[#FFB700]' : 'text-[#4A7FA5]'} />
                    ))}
                  </div>
                </div>
                <p className="font-mono text-xs text-[#E8F4FD]">{r.comment}</p>
                <p className="font-mono text-[10px] text-[#4A7FA5] mt-1">{fmtDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
