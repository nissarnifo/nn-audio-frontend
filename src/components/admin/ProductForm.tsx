'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Product, ProductVariant } from '@/types'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Partial<Product>
  onSubmit: (data: Partial<Product>) => void
  loading?: boolean
}

export default function ProductForm({ initial, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    sku: initial?.sku ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'amplifier',
    badge: initial?.badge ?? '',
    is_active: initial?.is_active ?? true,
  })

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    Object.entries(initial?.specs ?? {}).map(([key, value]) => ({ key, value }))
  )

  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    initial?.variants ?? [{ label: 'Standard', price: 0, stock_qty: 0, is_active: true }]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((f) => {
      const updated = { ...f, [name]: val }
      if (name === 'name') updated.slug = slugify(value)
      return updated
    })
  }

  function addSpec() {
    setSpecs((s) => [...s, { key: '', value: '' }])
  }
  function removeSpec(i: number) {
    setSpecs((s) => s.filter((_, idx) => idx !== i))
  }
  function updateSpec(i: number, field: 'key' | 'value', val: string) {
    setSpecs((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: val } : sp)))
  }

  function addVariant() {
    setVariants((v) => [...v, { label: '', price: 0, stock_qty: 0, is_active: true }])
  }
  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i))
  }
  function updateVariant(i: number, field: string, val: string | number | boolean) {
    setVariants((v) => v.map((vr, idx) => (idx === i ? { ...vr, [field]: val } : vr)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const specsObj = specs.reduce((acc, s) => {
      if (s.key) acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)
    onSubmit({ ...form, specs: specsObj, variants: variants as ProductVariant[], badge: form.badge as Product['badge'] || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="hud-card p-6 space-y-4">
        <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider">BASIC INFO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">PRODUCT NAME *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="input-hud" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">SLUG</label>
            <input name="slug" value={form.slug} onChange={handleChange} className="input-hud font-mono text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">SKU *</label>
            <input name="sku" value={form.sku} onChange={handleChange} required className="input-hud font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-2">CATEGORY *</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'amplifier', label: 'Amplifier' },
                { value: 'speaker', label: 'Speaker' },
                { value: 'speaker_box', label: 'Speaker Box' },
                { value: 'subwoofer', label: 'Subwoofer' },
                { value: 'processor', label: 'Processor' },
                { value: 'cable', label: 'Cable' },
                { value: 'accessory', label: 'Accessory' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c.value as typeof f.category }))}
                  className={`px-4 py-1.5 rounded font-mono text-xs border transition-all ${
                    form.category === c.value
                      ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                      : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)] hover:text-[#E8F4FD]'
                  }`}
                >
                  {c.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">BADGE</label>
            <select name="badge" value={form.badge} onChange={handleChange} className="input-hud">
              <option value="">None</option>
              {['BESTSELLER', 'TOP RATED', 'NEW', 'PRO', 'FLAGSHIP'].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 accent-[#00D4FF]" />
            <label htmlFor="is_active" className="text-sm text-[#E8F4FD] font-heading tracking-wide">ACTIVE (visible to customers)</label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#4A7FA5] font-mono mb-1">DESCRIPTION</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-hud resize-none" />
        </div>
      </div>

      {/* Specs */}
      <div className="hud-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider">SPECIFICATIONS</h3>
          <button type="button" onClick={addSpec} className="btn-cyan text-xs flex items-center gap-1">
            <Plus size={13} /> ADD ROW
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((sp, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={sp.key}
                onChange={(e) => updateSpec(i, 'key', e.target.value)}
                placeholder="Key (e.g. Power Output)"
                className="input-hud flex-1"
              />
              <input
                value={sp.value}
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="Value (e.g. 50W RMS)"
                className="input-hud flex-1"
              />
              <button type="button" onClick={() => removeSpec(i)} className="p-2 text-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] rounded transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {specs.length === 0 && (
            <p className="text-[#4A7FA5] text-sm font-mono">No specs yet. Click ADD ROW.</p>
          )}
        </div>
      </div>

      {/* Variants */}
      <div className="hud-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider">VARIANTS</h3>
          <button type="button" onClick={addVariant} className="btn-cyan text-xs flex items-center gap-1">
            <Plus size={13} /> ADD VARIANT
          </button>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={v.label ?? ''}
                onChange={(e) => updateVariant(i, 'label', e.target.value)}
                placeholder="Label"
                className="input-hud col-span-4"
              />
              <input
                type="number"
                value={v.price ?? 0}
                onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                placeholder="Price ₹"
                className="input-hud col-span-3"
              />
              <input
                type="number"
                value={v.stock_qty ?? 0}
                onChange={(e) => updateVariant(i, 'stock_qty', Number(e.target.value))}
                placeholder="Stock"
                className="input-hud col-span-2"
              />
              <div className="col-span-2 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={v.is_active ?? true}
                  onChange={(e) => updateVariant(i, 'is_active', e.target.checked)}
                  className="accent-[#00D4FF]"
                />
                <span className="text-xs text-[#4A7FA5] font-mono">Active</span>
              </div>
              <button type="button" onClick={() => removeVariant(i)} className="col-span-1 p-2 text-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] rounded transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-gold px-8">
          {loading ? 'SAVING...' : 'SAVE PRODUCT'}
        </button>
      </div>
    </form>
  )
}
