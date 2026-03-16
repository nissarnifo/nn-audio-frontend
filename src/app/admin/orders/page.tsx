'use client'
import { useState } from 'react'
import { Download, Truck, X, ChevronDown, ChevronUp, MessageSquare, CalendarDays, Search } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks'
import { StatusBadge, PageLoading, SectionHeader, Pagination, Spinner } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { OrderStatus, Order } from '@/types'

const STATUSES: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

/* ─── Date helpers ───────────────────────────────────────────────── */
function toISO(d: Date) { return d.toISOString().slice(0, 10) }

const PRESETS = [
  {
    label: 'TODAY',
    range: () => { const d = toISO(new Date()); return { from: d, to: d } },
  },
  {
    label: '7 DAYS',
    range: () => {
      const to = new Date()
      const from = new Date(); from.setDate(from.getDate() - 6)
      return { from: toISO(from), to: toISO(to) }
    },
  },
  {
    label: 'THIS MONTH',
    range: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toISO(from), to: toISO(now) }
    },
  },
  {
    label: 'LAST MONTH',
    range: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to   = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toISO(from), to: toISO(to) }
    },
  },
]

/* ─── Tracking modal (shown when admin picks SHIPPED) ──────────── */
function TrackingModal({
  order,
  onConfirm,
  onClose,
}: {
  order: Order
  onConfirm: (trackingNumber: string, trackingUrl: string) => void
  onClose: () => void
}) {
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm px-4">
      <div className="hud-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-[#00D4FF]" />
            <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider">TRACKING INFO</h3>
          </div>
          <button onClick={onClose} className="text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="font-mono text-xs text-[#4A7FA5] mb-5">
          Order <span className="text-[#00D4FF]">{order.order_number}</span> will be marked as{' '}
          <span className="text-[#00FF88]">SHIPPED</span>. Optionally add tracking details for the customer.
        </p>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-[#4A7FA5] block mb-1.5 tracking-widest">
              TRACKING NUMBER <span className="text-[rgba(74,127,165,0.5)]">(optional)</span>
            </label>
            <input
              className="input-hud w-full text-sm"
              placeholder="e.g. DTDC123456789IN"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="font-mono text-xs text-[#4A7FA5] block mb-1.5 tracking-widest">
              TRACKING URL <span className="text-[rgba(74,127,165,0.5)]">(optional)</span>
            </label>
            <input
              className="input-hud w-full text-sm"
              placeholder="https://www.dtdc.in/tracking/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onConfirm(trackingNumber, trackingUrl)}
            className="flex-1 btn-gold py-2.5 font-heading tracking-widest text-sm"
          >
            MARK SHIPPED
          </button>
          <button onClick={onClose} className="flex-1 btn-cyan py-2.5 font-heading tracking-widest text-sm">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useAdminOrders({
    status: statusFilter || undefined,
    page,
    from:   dateFrom || undefined,
    to:     dateTo   || undefined,
    search: search   || undefined,
  })
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus()

  // Tracking modal state
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)
  // Expanded detail rows
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function handleStatusFilter(s: string) { setStatusFilter(s); setPage(1) }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    const { from, to } = preset.range()
    setDateFrom(from)
    setDateTo(to)
    setPage(1)
    setActivePreset(preset.label)
  }

  function clearDates() {
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setActivePreset(null)
  }

  function handleStatusChange(order: Order, newStatus: string) {
    if (newStatus === 'SHIPPED') {
      setTrackingOrder(order)
    } else {
      updateStatus({ id: order.id, status: newStatus })
    }
  }

  function handleTrackingConfirm(trackingNumber: string, trackingUrl: string) {
    if (!trackingOrder) return
    updateStatus({
      id: trackingOrder.id,
      status: 'SHIPPED',
      tracking_number: trackingNumber || undefined,
      tracking_url: trackingUrl || undefined,
    })
    setTrackingOrder(null)
  }

  function handleExport() {
    const orders: Order[] = data?.data ?? []
    const rows = orders.map((o) => ({
      'Order Number': o.order_number,
      'Date': fmtDate(o.created_at),
      'Customer': o.address.name,
      'Phone': o.address.phone,
      'City': o.address.city,
      'State': o.address.state,
      'Pincode': o.address.pin,
      'Items': o.items.length,
      'Subtotal': o.subtotal,
      'Shipping': o.shipping,
      'Discount': o.discount ?? 0,
      'Total': o.total,
      'Status': o.status,
      'Payment Method': o.payment_method,
      'Payment Status': o.payment_status,
      'Coupon': o.coupon_code ?? '',
      'Tracking Number': o.tracking_number ?? '',
      'Tracking URL': o.tracking_url ?? '',
      'Delivery Notes': o.notes ?? '',
    }))
    const statusLabel = statusFilter ? statusFilter.toLowerCase() : 'all'
    const dateLabel = dateFrom ? `${dateFrom}${dateTo && dateTo !== dateFrom ? `_to_${dateTo}` : ''}` : new Date().toISOString().slice(0, 10)
    exportCsv(`orders-${statusLabel}-${dateLabel}.csv`, rows)
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {trackingOrder && (
        <TrackingModal
          order={trackingOrder}
          onConfirm={handleTrackingConfirm}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="ALL ORDERS" subtitle="Manage and update order statuses" />
        <button
          onClick={handleExport}
          disabled={!data?.data.length}
          className="flex items-center gap-2 px-4 py-2 border border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#00D4FF] hover:text-[#00D4FF] font-mono text-xs rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={13} /> EXPORT CSV
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Order # or customer name..."
            className="input-hud w-full pl-8 text-xs"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#E8F4FD]">
              <X size={12} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-cyan text-xs px-3 py-1.5 font-heading tracking-widest whitespace-nowrap">SEARCH</button>
      </form>

      {search && (
        <p className="font-mono text-xs text-[#4A7FA5] mb-3">
          Showing results for <span className="text-[#00D4FF]">"{search}"</span>
          <button onClick={clearSearch} className="ml-2 text-[#FF3366] hover:text-white transition-colors">× clear</button>
        </p>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`px-3 py-1 rounded font-mono text-xs border transition-all ${
              statusFilter === s
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'
            }`}
          >
            {s === '' ? 'ALL' : s}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-[rgba(0,212,255,0.08)]">
        <div className="flex items-center gap-1.5 text-[#4A7FA5]">
          <CalendarDays size={13} />
          <span className="font-mono text-xs tracking-widest">DATE</span>
        </div>

        {/* Quick presets */}
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => activePreset === p.label ? clearDates() : applyPreset(p)}
            className={`px-3 py-1 rounded font-mono text-xs border transition-all ${
              activePreset === p.label
                ? 'border-[#FFB700] text-[#FFB700] bg-[rgba(255,183,0,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Manual date inputs */}
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setActivePreset(null); setPage(1) }}
            className="input-hud text-xs py-1 px-2 font-mono w-36"
          />
          <span className="font-mono text-xs text-[#4A7FA5]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setActivePreset(null); setPage(1) }}
            className="input-hud text-xs py-1 px-2 font-mono w-36"
          />
        </div>

        {/* Clear */}
        {(dateFrom || dateTo) && (
          <button onClick={clearDates} className="flex items-center gap-1 font-mono text-xs text-[#FF3366] hover:text-white transition-colors">
            <X size={11} /> CLEAR
          </button>
        )}
      </div>

      <div className="hud-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.12)]">
                {['ORDER ID', 'CUSTOMER', 'DATE', 'ITEMS', 'TOTAL', 'STATUS', 'TRACKING', 'UPDATE'].map((h) => (
                  <th key={h} className="text-left p-4 font-mono text-[10px] text-[#4A7FA5] tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data.map((order) => (
                <>
                <tr key={order.id} className={`border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)] transition-colors ${expandedId === order.id ? 'bg-[rgba(0,212,255,0.03)]' : ''}`}>
                  <td className="p-4">
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="flex items-center gap-1.5 font-mono text-xs text-[#00D4FF] hover:text-white transition-colors"
                    >
                      {expandedId === order.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {order.order_number}
                      {order.notes && <MessageSquare size={10} className="text-[#FFB700]" />}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-[#E8F4FD]">{order.address.name}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{fmtDate(order.created_at)}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{order.items.length}</td>
                  <td className="p-4 font-mono text-sm text-[#FFB700]">{fmt(order.total)}</td>
                  <td className="p-4"><StatusBadge status={order.status} /></td>
                  <td className="p-4">
                    {order.tracking_number ? (
                      <div>
                        <p className="font-mono text-[10px] text-[#00FF88]">{order.tracking_number}</p>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] text-[#00D4FF] hover:underline"
                          >
                            Track →
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] text-[rgba(74,127,165,0.4)]">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      disabled={isPending}
                      className="input-hud text-xs py-1 px-2 w-32"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                {/* Expandable detail row */}
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="border-b border-[rgba(0,212,255,0.1)] bg-[rgba(0,212,255,0.02)]">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Delivery notes */}
                        {order.notes && (
                          <div className="md:col-span-3 flex gap-2 border border-[rgba(255,183,0,0.2)] bg-[rgba(255,183,0,0.04)] rounded px-4 py-3">
                            <MessageSquare size={13} className="text-[#FFB700] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-mono text-[10px] text-[#FFB700] mb-1 tracking-widest">DELIVERY NOTES</p>
                              <p className="text-sm text-[#E8F4FD] leading-relaxed">{order.notes}</p>
                            </div>
                          </div>
                        )}
                        {/* Address */}
                        <div>
                          <p className="font-mono text-[10px] text-[#4A7FA5] mb-2 tracking-widest">SHIP TO</p>
                          <p className="text-[#E8F4FD]">{order.address.name}</p>
                          <p className="text-[#4A7FA5]">{order.address.phone}</p>
                          <p className="text-[#4A7FA5] mt-1">
                            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                            {order.address.city}, {order.address.state} – {order.address.pin}
                          </p>
                        </div>
                        {/* Items */}
                        <div className="md:col-span-2">
                          <p className="font-mono text-[10px] text-[#4A7FA5] mb-2 tracking-widest">ITEMS</p>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between">
                                <span className="text-[#E8F4FD]">{item.product.name} <span className="text-[#4A7FA5]">({item.variant.label}) × {item.qty}</span></span>
                                <span className="font-mono text-[#FFB700] ml-4 flex-shrink-0">{fmt(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.data.length && (
          <div className="py-16 text-center">
            <p className="font-heading text-lg text-[#4A7FA5]">No orders found.</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPage={setPage} />
    </div>
  )
}
