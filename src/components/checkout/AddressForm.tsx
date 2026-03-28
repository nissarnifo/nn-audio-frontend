'use client'
import { useState } from 'react'
import type { Address } from '@/types'

interface Props {
  initial?: Partial<Address>
  onSubmit: (data: Omit<Address, 'id' | 'is_default'>) => void
  loading?: boolean
  submitLabel?: string
}

function FieldError({ id, msg }: { id: string; msg: string }) {
  return (
    <p id={id} role="alert" className="mt-1 font-mono text-[10px] text-[#FF3366]">
      {msg}
    </p>
  )
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
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((t) => ({ ...t, [e.target.name]: true }))
  }

  const phoneDigits = form.phone.replace(/\D/g, '').replace(/^91/, '')
  const phoneErr = touched.phone && phoneDigits.length > 0 && phoneDigits.length !== 10
    ? 'Enter a valid 10-digit phone number'
    : ''
  const pinErr = touched.pin && form.pin.length > 0 && !/^\d{6}$/.test(form.pin)
    ? 'PIN code must be exactly 6 digits'
    : ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Mark all as touched to show any remaining errors
    setTouched({ name: true, phone: true, line1: true, city: true, state: true, pin: true })
    if (phoneErr || pinErr) return
    onSubmit(form as Omit<Address, 'id' | 'is_default'>)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
      <div className="sm:col-span-2">
        <label className="block text-xs text-[#4A7FA5] font-mono mb-1">LABEL</label>
        <select name="label" value={form.label} onChange={handleChange} className="input-hud">
          <option value="HOME">Home</option>
          <option value="OFFICE">Office</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="addr-name" className="block text-xs text-[#4A7FA5] font-mono mb-1">FULL NAME *</label>
        <input
          id="addr-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          className="input-hud"
          placeholder="Recipient name"
        />
      </div>

      <div>
        <label htmlFor="addr-phone" className="block text-xs text-[#4A7FA5] font-mono mb-1">PHONE *</label>
        <input
          id="addr-phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          type="tel"
          aria-required="true"
          aria-invalid={!!phoneErr}
          aria-describedby={phoneErr ? 'phone-err' : undefined}
          className="input-hud"
          placeholder="+91 XXXXX XXXXX"
        />
        {phoneErr && <FieldError id="phone-err" msg={phoneErr} />}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="addr-line1" className="block text-xs text-[#4A7FA5] font-mono mb-1">ADDRESS LINE 1 *</label>
        <input
          id="addr-line1"
          name="line1"
          value={form.line1}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          className="input-hud"
          placeholder="House/Flat no, Street"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="addr-line2" className="block text-xs text-[#4A7FA5] font-mono mb-1">ADDRESS LINE 2</label>
        <input
          id="addr-line2"
          name="line2"
          value={form.line2}
          onChange={handleChange}
          className="input-hud"
          placeholder="Area, Landmark (optional)"
        />
      </div>

      <div>
        <label htmlFor="addr-city" className="block text-xs text-[#4A7FA5] font-mono mb-1">CITY *</label>
        <input
          id="addr-city"
          name="city"
          value={form.city}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          className="input-hud"
          placeholder="City"
        />
      </div>

      <div>
        <label htmlFor="addr-state" className="block text-xs text-[#4A7FA5] font-mono mb-1">STATE *</label>
        <input
          id="addr-state"
          name="state"
          value={form.state}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          className="input-hud"
          placeholder="State"
        />
      </div>

      <div>
        <label htmlFor="addr-pin" className="block text-xs text-[#4A7FA5] font-mono mb-1">PIN CODE *</label>
        <input
          id="addr-pin"
          name="pin"
          value={form.pin}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          aria-invalid={!!pinErr}
          aria-describedby={pinErr ? 'pin-err' : undefined}
          className="input-hud"
          placeholder="6-digit PIN"
          maxLength={6}
          inputMode="numeric"
        />
        {pinErr && <FieldError id="pin-err" msg={pinErr} />}
      </div>

      <div className="sm:col-span-2 flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-cyan">
          {loading ? 'SAVING...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
