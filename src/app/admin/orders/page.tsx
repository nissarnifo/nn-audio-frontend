'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks'
import { StatusBadge, PageLoading, SectionHeader, Pagination } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { OrderStatus, Order } from '@/types'

const STATUSES: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminOrders({ status: statusFilter || undefined, page })

  function handleStatusFilter(s: string) { setStatusFilter(s); setPage(1) }
  const { mutate: updateStatus } = useUpdateOrderStatus()

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
    }))
    const label = statusFilter ? statusFilter.toLowerCase() : 'all'
    exportCsv(`orders-${label}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
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

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      <div className="hud-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.12)]">
                {['ORDER ID', 'CUSTOMER', 'DATE', 'ITEMS', 'TOTAL', 'STATUS', 'UPDATE'].map((h) => (
                  <th key={h} className="text-left p-4 font-mono text-[10px] text-[#4A7FA5] tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data.map((order) => (
                <tr key={order.id} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                  <td className="p-4 font-mono text-xs text-[#00D4FF]">{order.order_number}</td>
                  <td className="p-4 text-sm text-[#E8F4FD]">{order.address.name}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{fmtDate(order.created_at)}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{order.items.length}</td>
                  <td className="p-4 font-mono text-sm text-[#FFB700]">{fmt(order.total)}</td>
                  <td className="p-4"><StatusBadge status={order.status} /></td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus({ id: order.id, status: e.target.value })}
                      className="input-hud text-xs py-1 px-2 w-32"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
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

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPage={setPage}
      />
    </div>
  )
}
