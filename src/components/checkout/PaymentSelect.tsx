'use client'
import { Truck, CreditCard } from 'lucide-react'

interface Props {
  selected: 'COD' | 'RAZORPAY'
  onSelect: (method: 'COD' | 'RAZORPAY') => void
}

export default function PaymentSelect({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* COD */}
      <button
        type="button"
        onClick={() => onSelect('COD')}
        className={`hud-card p-5 text-left transition-all ${
          selected === 'COD'
            ? 'border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.15)]'
            : 'border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.35)]'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Truck size={22} className={selected === 'COD' ? 'text-[#00D4FF]' : 'text-[#4A7FA5]'} />
          <span className="font-heading text-base tracking-wider text-[#E8F4FD]">CASH ON DELIVERY</span>
        </div>
        <p className="text-xs text-[#4A7FA5]">Pay when your order arrives at your door.</p>
        {selected === 'COD' && (
          <div className="mt-3 h-0.5 w-8 bg-[#00D4FF]" />
        )}
      </button>

      {/* Razorpay */}
      <button
        type="button"
        onClick={() => onSelect('RAZORPAY')}
        className={`hud-card p-5 text-left transition-all ${
          selected === 'RAZORPAY'
            ? 'border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.15)]'
            : 'border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.35)]'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={22} className={selected === 'RAZORPAY' ? 'text-[#00D4FF]' : 'text-[#4A7FA5]'} />
          <span className="font-heading text-base tracking-wider text-[#E8F4FD]">RAZORPAY</span>
        </div>
        <p className="text-xs text-[#4A7FA5]">UPI, Cards, Net Banking, Wallets. Instant & secure.</p>
        {selected === 'RAZORPAY' && (
          <div className="mt-3 h-0.5 w-8 bg-[#00D4FF]" />
        )}
      </button>
    </div>
  )
}
