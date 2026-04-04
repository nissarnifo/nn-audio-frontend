'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Package, Mail, Truck, Headphones } from 'lucide-react'
import { Suspense } from 'react'

const STEPS = [
  { icon: <Mail size={18} className="text-[#00D4FF]" />, label: 'Confirmation email sent to your inbox' },
  { icon: <Package size={18} className="text-[#FFB700]" />, label: 'Order processed within 24 hours' },
  { icon: <Truck size={18} className="text-[#00FF88]" />, label: 'Shipped with tracking update via SMS/email' },
  { icon: <Headphones size={18} className="text-[#4A7FA5]" />, label: 'Support: 9700929591 · Mon–Sat 10–18 IST' },
]

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-20 text-center">
      <div className="flex justify-center mb-5">
        <CheckCircle2 size={64} className="text-[#00FF88]" style={{ filter: 'drop-shadow(0 0 16px rgba(0,255,136,0.5))' }} />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl text-[#E8F4FD] tracking-wider mb-3">ORDER CONFIRMED!</h1>

      {orderId && (
        <div className="inline-block font-mono text-sm text-[#00D4FF] border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.06)] px-4 py-1.5 rounded mb-6">
          ORDER ID: <span className="font-bold">{orderId}</span>
        </div>
      )}

      <p className="font-body text-sm text-[#4A7FA5] mb-8">
        Thank you for your purchase from N&amp;N Audio Systems. Here&apos;s what happens next:
      </p>

      {/* What happens next */}
      <div className="hud-card p-5 mb-8 text-left">
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] flex items-center justify-center">
                {step.icon}
              </div>
              <p className="font-mono text-xs text-[#4A7FA5] leading-relaxed pt-2">{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/orders" className="btn-cyan px-8 py-3">
          TRACK MY ORDER
        </Link>
        <Link href="/products" className="btn-gold px-8 py-3">
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
