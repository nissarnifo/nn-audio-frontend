'use client'
import { useState } from 'react'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks'
import { StatusBadge, PageLoading, SectionHeader } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STATUSES: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useAdminOrders({ status: statusFilter || undefined })
  const { mutate: updateStatus } = useUpdateOrderStatus()

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="ALL ORDERS" subtitle="Manage and update order statuses" />

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
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
    </div>
  )
}
