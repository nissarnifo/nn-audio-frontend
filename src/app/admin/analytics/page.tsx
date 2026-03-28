'use client'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useAdminStats, useAdminAnalytics } from '@/hooks'
import { fmt } from '@/lib/utils'
import { PageLoading, SectionHeader } from '@/components/ui'
import { TrendingUp, ShoppingBag, Users, Tag } from 'lucide-react'

const PIE_COLORS = ['#00D4FF', '#FFB700', '#00FF88', '#1E90FF', '#FF3366', '#9B59B6']
const STATUS_COLORS: Record<string, string> = {
  PROCESSING: '#FFB700',
  SHIPPED: '#00D4FF',
  DELIVERED: '#00FF88',
  CANCELLED: '#FF3366',
}

const TT = {
  contentStyle: { background: '#0D1B2A', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4, fontSize: 11 },
  labelStyle: { color: '#E8F4FD', fontFamily: 'Share Tech Mono', fontSize: 11 },
  itemStyle: { color: '#E8F4FD', fontFamily: 'Share Tech Mono', fontSize: 11 },
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hud-card p-6">
      <h3 className="font-heading text-sm text-[#E8F4FD] tracking-widest mb-6">{title}</h3>
      {children}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics()

  if (statsLoading || analyticsLoading) return <PageLoading />

  const KPIs = [
    { icon: TrendingUp, label: 'TOTAL REVENUE', value: fmt(stats?.total_revenue ?? 0), color: '#FFB700' },
    { icon: TrendingUp, label: 'THIS MONTH', value: fmt(stats?.month_revenue ?? 0), color: '#00D4FF' },
    { icon: ShoppingBag, label: 'TOTAL ORDERS', value: String(stats?.total_orders ?? 0), color: '#00FF88' },
    { icon: Users, label: 'CUSTOMERS', value: String(stats?.total_customers ?? 0), color: '#1E90FF' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="ANALYTICS" subtitle="Sales insights and performance metrics" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {KPIs.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="hud-card p-5 flex items-start gap-3">
            <Icon size={20} style={{ color, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-mono text-xl font-bold text-[#E8F4FD]">{value}</p>
              <p className="font-mono text-[10px] text-[#4A7FA5] mt-1 tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Revenue — 30 days line chart */}
      <ChartCard title="DAILY REVENUE — LAST 30 DAYS">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={analytics?.daily_revenue ?? []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
            <XAxis dataKey="day" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TT} formatter={(v: number, name: string) => [name === 'revenue' ? fmt(v) : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
            <Area type="monotone" dataKey="revenue" stroke="#00D4FF" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#00D4FF' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row: Monthly Revenue + Orders by Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <ChartCard title="MONTHLY REVENUE — 6 MONTHS">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.monthly_revenue ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v: number) => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#00D4FF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ORDERS BY STATUS">
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
              >
                {(stats?.orders_by_status ?? []).map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#4A7FA5'} />
                ))}
              </Pie>
              <Tooltip {...TT} />
              <Legend formatter={(v) => <span style={{ color: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Revenue by Category + New Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <ChartCard title="REVENUE BY CATEGORY">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={analytics?.category_revenue ?? []}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...TT} formatter={(v: number) => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" radius={[0, 3, 3, 0]}>
                {(analytics?.category_revenue ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="NEW CUSTOMERS PER MONTH">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics?.new_customers ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v: number) => [v, 'New Customers']} />
              <Line type="monotone" dataKey="count" stroke="#00FF88" strokeWidth={2} dot={{ fill: '#00FF88', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Products */}
      <div className="mt-8">
        <ChartCard title="TOP PRODUCTS BY REVENUE">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.top_products?.slice(0, 5) ?? []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#4A7FA5', fontFamily: 'Share Tech Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v: number) => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {(stats?.top_products ?? []).slice(0, 5).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Coupon Usage Table */}
      {(analytics?.coupon_usage ?? []).length > 0 && (
        <div className="mt-8 hud-card p-6">
          <h3 className="font-heading text-sm text-[#E8F4FD] tracking-widest mb-5 flex items-center gap-2">
            <Tag size={14} className="text-[#FFB700]" />
            COUPON PERFORMANCE
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="text-[#4A7FA5] text-xs tracking-widest border-b border-[rgba(0,212,255,0.1)]">
                  <th className="text-left py-2 pr-4">CODE</th>
                  <th className="text-right py-2 pr-4">USES</th>
                  <th className="text-right py-2">TOTAL SAVINGS</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.coupon_usage.map((c, i) => (
                  <tr key={c.code} className={`border-b border-[rgba(0,212,255,0.05)] ${i % 2 === 0 ? '' : 'bg-[rgba(0,212,255,0.02)]'}`}>
                    <td className="py-2.5 pr-4 text-[#00D4FF]">{c.code}</td>
                    <td className="py-2.5 pr-4 text-right text-[#E8F4FD]">{c.uses}</td>
                    <td className="py-2.5 text-right text-[#00FF88]">{fmt(c.total_savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
