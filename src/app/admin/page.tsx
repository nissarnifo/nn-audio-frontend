'use client'
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle, AlertTriangle } from 'lucide-react'
import { useAdminStats } from '@/hooks'
import { fmt } from '@/lib/utils'
import { PageLoading, StatusBadge, SectionHeader } from '@/components/ui'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) return <PageLoading />

  const KPIs = [
    { label: 'TOTAL REVENUE', value: fmt(stats?.total_revenue ?? 0), icon: <TrendingUp size={22} />, color: 'text-[#00FF88]' },
    { label: 'THIS MONTH', value: fmt(stats?.month_revenue ?? 0), icon: <TrendingUp size={22} />, color: 'text-[#00D4FF]' },
    { label: 'TOTAL ORDERS', value: String(stats?.total_orders ?? 0), icon: <ShoppingBag size={22} />, color: 'text-[#FFB700]' },
    { label: 'PENDING', value: String(stats?.pending_orders ?? 0), icon: <AlertCircle size={22} />, color: 'text-[#FF3366]' },
  ]

  const QUICK_LINKS = [
    { href: '/admin/products', label: 'MANAGE PRODUCTS', icon: <Package size={20} /> },
    { href: '/admin/orders', label: 'ALL ORDERS', icon: <ShoppingBag size={20} /> },
    { href: '/admin/customers', label: 'CUSTOMERS', icon: <Users size={20} /> },
    { href: '/admin/analytics', label: 'ANALYTICS', icon: <TrendingUp size={20} /> },
  ]

  const lowStock = stats?.low_stock_variants ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="ADMIN DASHBOARD" subtitle="N & N Audio Systems — Control Center" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {KPIs.map((kpi) => (
          <div key={kpi.label} className="hud-card p-5">
            <div className={`mb-3 ${kpi.color}`}>{kpi.icon}</div>
            <p className="font-mono text-2xl font-bold text-[#E8F4FD]">{kpi.value}</p>
            <p className="font-mono text-[10px] text-[#4A7FA5] mt-1 tracking-widest">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hud-card p-5 flex flex-col items-center gap-3 text-center">
            <div className="text-[#00D4FF]">{l.icon}</div>
            <span className="font-heading text-sm text-[#E8F4FD] tracking-wider">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats + Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="hud-card p-6">
          <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-4">ORDERS BY STATUS</h3>
          <div className="space-y-3">
            {stats?.orders_by_status?.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <StatusBadge status={s.status as 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'} />
                <span className="font-mono text-[#E8F4FD]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hud-card p-6">
          <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-4">TOP PRODUCTS</h3>
          <div className="space-y-3">
            {stats?.top_products?.slice(0, 5).map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#4A7FA5]">#{i + 1}</span>
                  <span className="text-sm text-[#E8F4FD] truncate max-w-[160px]">{p.name}</span>
                </div>
                <span className="font-mono text-sm text-[#FFB700]">{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="hud-card p-6 border border-[rgba(255,183,0,0.2)] bg-[rgba(255,183,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#FFB700]" />
              <h3 className="font-heading text-base text-[#FFB700] tracking-wider">LOW STOCK ALERTS</h3>
              <span className="font-mono text-[10px] bg-[rgba(255,183,0,0.15)] text-[#FFB700] border border-[rgba(255,183,0,0.3)] px-2 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            </div>
            <Link
              href="/admin/inventory"
              className="font-mono text-xs text-[#00D4FF] hover:text-[#E8F4FD] transition-colors"
            >
              VIEW INVENTORY →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStock.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded border ${
                  v.stock_qty === 0
                    ? 'border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.05)]'
                    : 'border-[rgba(255,183,0,0.2)] bg-[rgba(255,183,0,0.04)]'
                }`}
              >
                <div className="min-w-0 mr-3">
                  <p className="font-mono text-[10px] text-[#4A7FA5] truncate">{v.sku}</p>
                  <p className="text-xs text-[#E8F4FD] truncate leading-tight">{v.product_name}</p>
                  <p className="font-mono text-[10px] text-[#4A7FA5] mt-0.5">{v.label}</p>
                </div>
                <span
                  className={`font-mono text-sm font-bold flex-shrink-0 ${
                    v.stock_qty === 0 ? 'text-[#FF3366]' : 'text-[#FFB700]'
                  }`}
                >
                  {v.stock_qty === 0 ? 'OUT' : v.stock_qty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
