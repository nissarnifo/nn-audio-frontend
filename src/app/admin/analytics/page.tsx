'use client'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { useAdminStats } from '@/hooks'
import { fmt } from '@/lib/utils'
import { PageLoading, SectionHeader } from '@/components/ui'

const PIE_COLORS = ['#00D4FF', '#FFB700', '#00FF88', '#1E90FF', '#FF3366']
const STATUS_COLORS: Record<string, string> = {
  PROCESSING: '#FFB700',
  SHIPPED: '#00D4FF',
  DELIVERED: '#00FF88',
  CANCELLED: '#FF3366',
}

const TooltipStyle = {
  contentStyle: { background: '#0D1B2A', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4 },
  labelStyle: { color: '#E8F4FD', fontFamily: 'Share Tech Mono', fontSize: 11 },
  itemStyle: { color: '#E8F4FD', fontFamily: 'Share Tech Mono', fontSize: 11 },
}

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) return <PageLoading />

  const KPIs = [
    { label: 'TOTAL REVENUE', value: fmt(stats?.total_revenue ?? 0) },
    { label: 'THIS MONTH', value: fmt(stats?.month_revenue ?? 0) },
    { label: 'TOTAL ORDERS', value: String(stats?.total_orders ?? 0) },
    { label: 'ORDERS THIS MONTH', value: String(stats?.month_orders ?? 0) },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="ANALYTICS" subtitle="Sales insights and performance metrics" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {KPIs.map((k) => (
          <div key={k.label} className="hud-card p-5">
            <p className="font-mono text-xl font-bold text-[#E8F4FD]">{k.value}</p>
            <p className="font-mono text-[10px] text-[#4A7FA5] mt-1 tracking-widest">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="hud-card p-6 mb-8">
        <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider mb-6">MONTHLY REVENUE</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.monthly_revenue ?? []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TooltipStyle} formatter={(value: number) => [fmt(value), 'Revenue']} />
            <Bar dataKey="revenue" fill="#00D4FF" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Products Pie */}
        <div className="hud-card p-6">
          <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider mb-6">TOP 5 PRODUCTS</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats?.top_products?.slice(0, 5) ?? []}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'rgba(0,212,255,0.3)' }}
              >
                {(stats?.top_products ?? []).slice(0, 5).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TooltipStyle} formatter={(value: number) => fmt(value)} />
              <Legend
                formatter={(value) => <span style={{ color: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status Donut */}
        <div className="hud-card p-6">
          <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider mb-6">ORDERS BY STATUS</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats?.orders_by_status ?? []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                label={({ status }) => status}
              >
                {(stats?.orders_by_status ?? []).map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#4A7FA5'} />
                ))}
              </Pie>
              <Tooltip {...TooltipStyle} />
              <Legend
                formatter={(value) => <span style={{ color: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
