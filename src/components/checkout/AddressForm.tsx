'use client'
import { useState } from 'react'
import type { Address } from '@/types'

interface Props {
  initial?: Partial<Address>
  onSubmit: (data: Omit<Address, 'id' | 'is_default'>) => void
  loading?: boolean
  submitLabel?: string
}

export default function AddressForm({ initial, onSubmit, loading, submitLabel = 'SAVE ADDRESS' }: Props) {
  const [form, setForm] = useState({
    label: initial?.label ?? 'HOME',
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    pin: initial?.pin ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form as Omit<Address, 'id' | 'is_default'>)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">LABEL</label>
        <select name="label" value={form.label} onChange={handleChange} className="input-hud">
          <option value="HOME">Home</option>
          <option value="OFFICE">Office</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">FULL NAME *</label>
        <input name="name" value={form.name} onChange={handleChange} required className="input-hud" placeholder="Recipient name" />
      </div>

      <div>
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">PHONE *</label>
        <input name="phone" value={form.phone} onChange={handleChange} required className="input-hud" placeholder="+91 XXXXX XXXXX" type="tel" />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">ADDRESS LINE 1 *</label>
        <input name="line1" value={form.line1} onChange={handleChange} required className="input-hud" placeholder="House/Flat no, Street" />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">ADDRESS LINE 2</label>
        <input name="line2" value={form.line2} onChange={handleChange} className="input-hud" placeholder="Area, Landmark (optional)" />
      </div>

      <div>
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">CITY *</label>
        <input name="city" value={form.city} onChange={handleChange} required className="input-hud" placeholder="City" />
      </div>

      <div>
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">STATE *</label>
        <input name="state" value={form.state} onChange={handleChange} required className="input-hud" placeholder="State" />
      </div>

      <div>
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">PIN CODE *</label>
        <input name="pin" value={form.pin} onChange={handleChange} required className="input-hud" placeholder="6-digit PIN" maxLength={6} pattern="[0-9]{6}" inputMode="numeric" />
      </div>

      <div className="sm:col-span-2 flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-cyan">
          {loading ? 'SAVING...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
