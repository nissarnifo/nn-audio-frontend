'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ToggleLeft, ToggleRight, BarChart2, X, ExternalLink } from 'lucide-react'
import { couponsApi } from '@/services/api'
import { SectionHeader, Spinner } from '@/components/ui'
import { fmtDate, fmt } from '@/lib/utils'
import type { Coupon, CouponType, CouponUsage } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

const EMPTY = { code: '', type: 'PERCENT' as CouponType, value: '', min_order: '', max_uses: '', expires_at: '' }

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'text-[#00FF88]',
  PROCESSING: 'text-[#FFB700]',
  SHIPPED: 'text-[#00D4FF]',
  CANCELLED: 'text-[#FF3366]',
  RETURNED: 'text-[#4A7FA5]',
}

export default function AdminCouponsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponsApi.getAll().then((r) => r.data),
  })

  const { data: usage, isLoading: usageLoading } = useQuery<CouponUsage>({
    queryKey: ['coupon-usage', selectedCoupon?.id],
    queryFn: () => couponsApi.getUsage(selectedCoupon!.id).then((r) => r.data),
    enabled: !!selectedCoupon,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      couponsApi.update(id, { is_active } as Partial<Coupon>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      if (selectedCoupon) setSelectedCoupon(null)
      toast.success('Coupon deleted')
    },
  })

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!form.code || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    try {
      await couponsApi.create({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        min_order: form.min_order ? parseFloat(form.min_order) : undefined,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      })
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon created')
      setForm(EMPTY)
      setShowForm(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'input-hud text-sm py-1.5'
  const sel = 'input-hud text-sm py-1.5'

  const usagePct = usage && usage.max_uses ? Math.min(100, Math.round((usage.used_count / usage.max_uses) * 100)) : null

  return (
    <div className="p-6 max-w-7xl flex gap-6">
      {/* ── Main panel ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <SectionHeader title="COUPONS" />
          <button onClick={() => setShowForm((v) => !v)} className="btn-cyan flex items-center gap-2 px-4 py-2">
            <Plus size={15} /> NEW COUPON
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="hud-card p-5 mb-6">
            <h3 className="font-heading text-sm text-[#E8F4FD] tracking-widest mb-4">CREATE COUPON</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">CODE *</label>
                <input
                  className={inp + ' uppercase'}
                  placeholder="SAVE20"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">TYPE *</label>
                <select className={sel} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">VALUE *</label>
                <input
                  type="number"
                  min={0}
                  className={inp}
                  placeholder={form.type === 'PERCENT' ? '20' : '500'}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">MIN ORDER (₹)</label>
                <input
                  type="number"
                  min={0}
                  className={inp}
                  placeholder="0"
                  value={form.min_order}
                  onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">MAX USES</label>
                <input
                  type="number"
                  min={1}
                  className={inp}
                  placeholder="Unlimited"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#4A7FA5] block mb-1">EXPIRES AT</label>
                <input
                  type="date"
                  className={inp}
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-gold px-5 py-2 flex items-center gap-2">
                {saving ? <Spinner size={14} /> : null} CREATE
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY) }} className="btn-cyan px-5 py-2">
                CANCEL
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size={24} /></div>
        ) : coupons.length === 0 ? (
          <div className="hud-card p-10 text-center">
            <p className="font-mono text-xs text-[#4A7FA5]">NO COUPONS YET</p>
          </div>
        ) : (
          <div className="hud-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.1)]">
                  {['CODE', 'TYPE', 'VALUE', 'MIN ORDER', 'USES', 'EXPIRES', 'STATUS', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-xs text-[#4A7FA5] tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: Coupon) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[rgba(0,212,255,0.06)] cursor-pointer transition-colors ${
                      selectedCoupon?.id === c.id
                        ? 'bg-[rgba(0,212,255,0.06)]'
                        : 'hover:bg-[rgba(0,212,255,0.03)]'
                    }`}
                    onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#00D4FF] tracking-widest">{c.code}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5]">{c.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E8F4FD]">
                      {c.type === 'PERCENT' ? `${c.value}%` : fmt(c.value)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5]">
                      {c.min_order > 0 ? fmt(c.min_order) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5]">
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5]">
                      {c.expires_at ? fmtDate(c.expires_at) : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleMutation.mutate({ id: c.id, is_active: !c.is_active })}
                        className={`flex items-center gap-1.5 font-mono text-xs transition-colors ${c.is_active ? 'text-[#00FF88]' : 'text-[#4A7FA5]'}`}
                      >
                        {c.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {c.is_active ? 'ACTIVE' : 'OFF'}
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)}
                          className={`transition-colors ${selectedCoupon?.id === c.id ? 'text-[#00D4FF]' : 'text-[#4A7FA5] hover:text-[#00D4FF]'}`}
                          title="View analytics"
                        >
                          <BarChart2 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete coupon ${c.code}?`)) deleteMutation.mutate(c.id)
                          }}
                          className="text-[#4A7FA5] hover:text-[#FF3366] transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Analytics Drawer ── */}
      {selectedCoupon && (
        <div className="w-[360px] flex-shrink-0">
          <div className="hud-card overflow-hidden sticky top-4">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
              <div>
                <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-0.5">COUPON ANALYTICS</p>
                <p className="font-heading text-base text-[#00D4FF] tracking-wider">{selectedCoupon.code}</p>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="w-7 h-7 flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {usageLoading ? (
              <div className="flex justify-center py-16"><Spinner size={20} /></div>
            ) : usage ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-0 border-b border-[rgba(0,212,255,0.1)]">
                  <div className="px-5 py-4 border-r border-[rgba(0,212,255,0.1)]">
                    <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-1">TOTAL USES</p>
                    <p className="font-mono text-2xl font-bold text-[#E8F4FD]">{usage.used_count}</p>
                    {usage.max_uses && (
                      <p className="font-mono text-[10px] text-[#4A7FA5] mt-0.5">of {usage.max_uses}</p>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-1">TOTAL DISCOUNT</p>
                    <p className="font-mono text-xl font-bold text-[#FF3366]">{fmt(usage.total_discount)}</p>
                    <p className="font-mono text-[10px] text-[#4A7FA5] mt-0.5">given away</p>
                  </div>
                </div>

                {/* Usage progress bar */}
                {usagePct !== null && (
                  <div className="px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest">USAGE LIMIT</p>
                      <p className="font-mono text-[10px] text-[#E8F4FD]">{usagePct}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(0,212,255,0.1)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePct >= 90 ? 'bg-[#FF3366]' : usagePct >= 60 ? 'bg-[#FFB700]' : 'bg-[#00FF88]'
                        }`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Orders list */}
                <div>
                  <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest px-5 py-3 border-b border-[rgba(0,212,255,0.08)]">
                    ORDERS ({usage.orders.length})
                  </p>
                  {usage.orders.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="font-mono text-xs text-[#4A7FA5]">No orders used this coupon yet</p>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-[rgba(0,212,255,0.06)]">
                      {usage.orders.map((o) => (
                        <div key={o.id} className="px-5 py-3 hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-[#E8F4FD] truncate">{o.customer}</p>
                              <p className="font-mono text-[10px] text-[#4A7FA5] truncate">{o.email}</p>
                            </div>
                            <Link
                              href={`/admin/orders?id=${o.id}`}
                              className="flex-shrink-0 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mt-0.5"
                              title="View order"
                            >
                              <ExternalLink size={11} />
                            </Link>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="font-mono text-[10px] text-[#4A7FA5]">{fmtDate(o.date)}</p>
                            <span className={`font-mono text-[10px] ${STATUS_COLORS[o.status] ?? 'text-[#4A7FA5]'}`}>
                              {o.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-mono text-[10px] text-[#4A7FA5]">
                              Order: <span className="text-[#E8F4FD]">{fmt(o.total)}</span>
                            </p>
                            <p className="font-mono text-[10px] text-[#FF3366]">-{fmt(o.discount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
