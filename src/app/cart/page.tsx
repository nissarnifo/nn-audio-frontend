'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { fmt, cloudinaryUrl, getPrimaryImage } from '@/lib/utils'
import { Divider, EmptyState } from '@/components/ui'

export default function CartPage() {
  const { items, subtotal, shipping, total, removeItem, updateQty } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState
          icon={<ShoppingBag size={56} />}
          title="Your Cart is Empty"
          description="Add some products to your cart to get started."
          action={
            <Link href="/products" className="btn-gold px-8 py-3">
              SHOP NOW
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">CART</h1>
      <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const img = getPrimaryImage(item.product.images)
            return (
              <div key={item.id} className="hud-card p-4 flex gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-[#0D1B2A]">
                  {img && (
                    <Image
                      src={cloudinaryUrl(img.url, 200)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-[#4A7FA5] mb-0.5">{item.product.sku}</p>
                  <h3 className="font-heading text-base text-[#E8F4FD] line-clamp-1">{item.product.name}</h3>
                  <p className="text-xs text-[#4A7FA5] mt-0.5">{item.variant.label}</p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty controls */}
                    <div className="flex items-center border border-[rgba(0,212,255,0.25)] rounded">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="px-2 py-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono text-sm"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 font-mono text-sm text-[#E8F4FD] border-x border-[rgba(0,212,255,0.25)]">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="px-2 py-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono text-sm"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#FFB700] font-bold">
                        {fmt(item.variant.price * item.qty)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-[#4A7FA5] hover:text-[#FF3366] transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="hud-card p-6 sticky top-24">
            <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">ORDER SUMMARY</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4A7FA5] font-mono">Subtotal</span>
                <span className="text-[#E8F4FD] font-mono">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A7FA5] font-mono">Shipping</span>
                <span className={`font-mono ${shipping === 0 ? 'text-[#00FF88]' : 'text-[#E8F4FD]'}`}>
                  {shipping === 0 ? 'FREE' : fmt(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-[#4A7FA5] font-mono">
                  Add {fmt(5000 - subtotal)} more for free shipping
                </p>
              )}
            </div>

            <Divider className="my-5" />

            <div className="flex justify-between mb-6">
              <span className="font-heading text-lg text-[#E8F4FD] tracking-wider">TOTAL</span>
              <span className="font-mono text-xl text-[#FFB700] font-bold">{fmt(total)}</span>
            </div>

            <Link href="/checkout" className="btn-gold w-full text-center block py-3 font-heading tracking-widest">
              PROCEED TO CHECKOUT
            </Link>
            <Link href="/products" className="btn-cyan w-full text-center block py-2 mt-3 text-sm">
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
