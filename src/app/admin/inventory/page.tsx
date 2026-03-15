'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Package, TrendingDown, TrendingUp, AlertTriangle, Plus, Minus, History, X } from 'lucide-react'
import { useInventory, useStockMovements, useRestock, useAdjustStock } from '@/hooks'
import { PageLoading, Spinner } from '@/components/ui'
import { fmt, cloudinaryUrl, fmtDate } from '@/lib/utils'
import type { InventoryVariant } from '@/services/api'

/* ─── Stock status helpers ───────────────────────────────────────── */
function stockStatus(qty: number): { label: string; color: string; bg: string } {
  if (qty === 0) return { label: 'OUT OF STOCK', color: '#FF3366', bg: 'rgba(255,51,102,0.1)' }
  if (qty <= 5)  return { label: 'LOW STOCK',    color: '#FFB700', bg: 'rgba(255,183,0,0.1)' }
  return              { label: 'IN STOCK',       color: '#00FF88', bg: 'rgba(0,255,136,0.1)' }
}

const MOVEMENT_COLORS: Record<string, string> = {
  PURCHASE:   '#00FF88',
  SALE:       '#FF3366',
  ADJUSTMENT: '#FFB700',
  RETURN:     '#00D4FF',
}

/* ─── Restock / Adjust Modal ─────────────────────────────────────── */
function StockModal({
  variant,
  mode,
  onClose,
}: {
  variant: InventoryVariant
  mode: 'restock' | 'adjust'
  onClose: () => void
}) {
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const { mutateAsync: restock, isPending: restocking } = useRestock()
  const { mutateAsync: adjust,  isPending: adjusting  } = useAdjustStock()
  const isPending = restocking || adjusting

  async function handleSubmit() {
    const finalQty = mode === 'adjust' ? qty : qty
    if (mode === 'restock') await restock({ variantId: variant.id, qty: finalQty, note })
    else await adjust({ variantId: variant.id, qty: finalQty, note })
    onClose()
  }

  const isRestock = mode === 'restock'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md hud-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg text-[#E8F4FD] tracking-wider">
            {isRestock ? 'RESTOCK ITEM' : 'ADJUST STOCK'}
          </h2>
          <button onClick={onClose} className="text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Product info */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.04)]">
          {variant.product.image && (
            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <Image src={cloudinaryUrl(variant.product.image, 100)} alt={variant.product.name} fill className="object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm text-[#E8F4FD] font-heading truncate">{variant.product.name}</p>
            <p className="text-xs text-[#4A7FA5] font-mono">{variant.label} · SKU: {variant.product.sku}</p>
            <p className="text-xs font-mono mt-0.5">
              Current stock: <span className={`font-bold ${variant.stock_qty === 0 ? 'text-[#FF3366]' : variant.stock_qty <= 5 ? 'text-[#FFB700]' : 'text-[#00FF88]'}`}>{variant.stock_qty}</span>
            </p>
          </div>
        </div>

        {/* Qty input */}
        <div className="mb-4">
          <label className="block text-xs text-[#4A7FA5] font-mono mb-1">
            {isRestock ? 'QUANTITY TO ADD' : 'ADJUSTMENT (+ or −)'}
          </label>
          <div className="flex items-center gap-2">
            {!isRestock && (
              <button onClick={() => setQty(q => q - 1)}
                className="w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:text-[#FF3366] hover:border-[#FF3366] transition-colors">
                <Minus size={14} />
              </button>
            )}
            <input
              type="number"
              min={isRestock ? 1 : undefined}
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 0)}
              className="input-hud flex-1 text-center font-mono text-lg"
            />
            <button onClick={() => setQty(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:text-[#00FF88] hover:border-[#00FF88] transition-colors">
              <Plus size={14} />
            </button>
          </div>
          {!isRestock && (
            <p className="text-xs text-[#4A7FA5] font-mono mt-1">
              New stock: <span className="text-[#00D4FF]">{Math.max(0, variant.stock_qty + qty)}</span>
            </p>
          )}
          {isRestock && (
            <p className="text-xs text-[#4A7FA5] font-mono mt-1">
              New stock: <span className="text-[#00D4FF]">{variant.stock_qty + qty}</span>
            </p>
          )}
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="block text-xs text-[#4A7FA5] font-mono mb-1">NOTE (optional)</label>
          <input
            type="text"
            placeholder={isRestock ? 'e.g. Bought from supplier XYZ' : 'e.g. Damaged units removed'}
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-hud w-full"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-cyan flex-1">CANCEL</button>
          <button onClick={handleSubmit} disabled={isPending || (isRestock && qty < 1)}
            className="btn-gold flex-1 flex items-center justify-center gap-2">
            {isPending ? <Spinner size={16} /> : isRestock ? <TrendingUp size={14} /> : null}
            {isPending ? 'SAVING…' : isRestock ? 'ADD STOCK' : 'ADJUST'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const { data, isLoading } = useInventory()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'out' | 'low' | 'ok'>('all')
  const [modal, setModal] = useState<{ variant: InventoryVariant; mode: 'restock' | 'adjust' } | null>(null)
  const [showMovements, setShowMovements] = useState(false)
  const [movementType, setMovementType] = useState<string>('')
  const { data: movements, isLoading: movLoading } = useStockMovements(
    showMovements ? { type: movementType || undefined } : undefined
  )

  if (isLoading) return <PageLoading />

  const { variants = [], summary } = data ?? { variants: [], summary: { total_skus: 0, out_of_stock: 0, low_stock: 0, total_value: 0 } }

  const filtered = variants.filter(v => {
    const matchSearch = !search ||
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.product.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'out' ? v.stock_qty === 0 :
      filterStatus === 'low' ? v.stock_qty > 0 && v.stock_qty <= 5 :
      v.stock_qty > 5
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider">INVENTORY</h1>
          <div className="h-0.5 w-10 bg-[#00D4FF] mt-1" />
          <p className="text-[#4A7FA5] font-mono text-xs mt-2">Monitor stock, log purchases and track all movements</p>
        </div>
        <button
          onClick={() => setShowMovements(s => !s)}
          className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs border transition-all ${showMovements ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]' : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'}`}>
          <History size={14} /> {showMovements ? 'HIDE' : 'SHOW'} MOVEMENT LOG
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        {[
          { label: 'TOTAL SKUs',     value: summary.total_skus,                       icon: <Package size={18} />,      color: '#00D4FF' },
          { label: 'OUT OF STOCK',   value: summary.out_of_stock,                     icon: <AlertTriangle size={18} />, color: '#FF3366' },
          { label: 'LOW STOCK (≤5)', value: summary.low_stock,                        icon: <TrendingDown size={18} />,  color: '#FFB700' },
          { label: 'INVENTORY VALUE', value: fmt(summary.total_value),                icon: <TrendingUp size={18} />,    color: '#00FF88' },
        ].map(card => (
          <div key={card.label} className="hud-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: card.color + '18', color: card.color }}>
              {card.icon}
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest">{card.label}</p>
              <p className="font-heading text-xl text-[#E8F4FD]">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Movement log (collapsible) */}
      {showMovements && (
        <div className="hud-card p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-[#E8F4FD] tracking-wider">STOCK MOVEMENT LOG</h2>
            <div className="flex gap-2">
              {['', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN'].map(t => (
                <button key={t} onClick={() => setMovementType(t)}
                  className={`px-2 py-1 rounded font-mono text-[10px] border transition-all ${movementType === t ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]' : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5]'}`}>
                  {t || 'ALL'}
                </button>
              ))}
            </div>
          </div>
          {movLoading ? <div className="flex justify-center py-6"><Spinner size={20} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[rgba(0,212,255,0.1)]">
                    {['DATE', 'PRODUCT', 'VARIANT', 'TYPE', 'QTY', 'NOTE'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[#4A7FA5] tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements?.data.map(m => (
                    <tr key={m.id} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.03)] transition-colors">
                      <td className="py-2 px-3 text-[#4A7FA5]">{fmtDate(m.created_at)}</td>
                      <td className="py-2 px-3 text-[#E8F4FD]">{m.product.name}</td>
                      <td className="py-2 px-3 text-[#A8C8E0]">{m.variant.label}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px]"
                          style={{ color: MOVEMENT_COLORS[m.type], background: MOVEMENT_COLORS[m.type] + '18' }}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold"
                        style={{ color: m.qty > 0 ? '#00FF88' : '#FF3366' }}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </td>
                      <td className="py-2 px-3 text-[#4A7FA5]">{m.note ?? '—'}</td>
                    </tr>
                  ))}
                  {!movements?.data.length && (
                    <tr><td colSpan={6} className="py-8 text-center text-[#4A7FA5]">No movements yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search product, SKU or variant…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-hud w-64 text-sm"
        />
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'ALL' },
            { key: 'out', label: 'OUT OF STOCK' },
            { key: 'low', label: 'LOW STOCK' },
            { key: 'ok',  label: 'IN STOCK' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key as typeof filterStatus)}
              className={`px-3 py-1.5 rounded font-mono text-xs border transition-all ${filterStatus === f.key ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]' : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs text-[#4A7FA5] ml-auto">{filtered.length} items</p>
      </div>

      {/* Stock table */}
      <div className="hud-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.04)]">
                {['PRODUCT', 'SKU', 'CATEGORY', 'VARIANT', 'PRICE', 'STOCK', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-mono text-[10px] text-[#4A7FA5] tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const status = stockStatus(v.stock_qty)
                return (
                  <tr key={v.id} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.03)] transition-colors">
                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {v.product.image ? (
                          <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-[rgba(0,212,255,0.15)]">
                            <Image src={cloudinaryUrl(v.product.image, 80)} alt={v.product.name} fill className="object-contain" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded bg-[rgba(0,212,255,0.05)] flex-shrink-0" />
                        )}
                        <span className="text-[#E8F4FD] font-heading text-xs leading-tight max-w-[140px] truncate">
                          {v.product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#4A7FA5]">{v.product.sku}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#A8C8E0] capitalize">{v.product.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#A8C8E0]">{v.label}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#FFB700]">{fmt(v.price)}</td>
                    {/* Stock qty */}
                    <td className="py-3 px-4">
                      <span className={`font-heading text-lg font-bold ${v.stock_qty === 0 ? 'text-[#FF3366]' : v.stock_qty <= 5 ? 'text-[#FFB700]' : 'text-[#00FF88]'}`}>
                        {v.stock_qty}
                      </span>
                    </td>
                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider"
                        style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setModal({ variant: v, mode: 'restock' })}
                          className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] border border-[rgba(0,255,136,0.3)] text-[#00FF88] hover:bg-[rgba(0,255,136,0.08)] transition-colors">
                          <TrendingUp size={10} /> RESTOCK
                        </button>
                        <button
                          onClick={() => setModal({ variant: v, mode: 'adjust' })}
                          className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] border border-[rgba(255,183,0,0.3)] text-[#FFB700] hover:bg-[rgba(255,183,0,0.08)] transition-colors">
                          <Minus size={10} /> ADJUST
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center font-mono text-[#4A7FA5]">
                    No items match your filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <StockModal
          variant={modal.variant}
          mode={modal.mode}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
