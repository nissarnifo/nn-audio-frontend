'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 size={72} className="text-[#00FF88]" style={{ filter: 'drop-shadow(0 0 16px rgba(0,255,136,0.5))' }} />
      </div>
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-3">ORDER CONFIRMED!</h1>
      {orderId && (
        <p className="font-mono text-[#00D4FF] text-sm mb-2">ORDER ID: {orderId}</p>
      )}
      <p className="text-[#4A7FA5] mb-10">
        Thank you for your purchase. You will receive a confirmation email shortly.
        Our team will process your order within 24 hours.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
