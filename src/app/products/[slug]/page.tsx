'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingCart, ChevronLeft } from 'lucide-react'
import { useProduct } from '@/hooks'
import Gallery from '@/components/product/Gallery'
import { Stars, StatusBadge, Badge, PageLoading, Divider } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import type { ProductVariant } from '@/types'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: product, isLoading } = useProduct(slug)
  const addItem = useCartStore((s) => s.addItem)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)

  if (isLoading) return <PageLoading />
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="font-heading text-2xl text-[#FF3366]">Product not found</p>
    </div>
  )

  const activeVariants = product.variants.filter((v) => v.is_active)
  const variant = selectedVariant ?? activeVariants[0]
  const inStock = variant?.stock_qty > 0

  function handleAdd() {
    if (!variant) return
    addItem(product!, variant, qty)
    toast.success(`${product!.name} added to cart!`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mb-8 font-mono text-sm"
      >
        <ChevronLeft size={16} /> BACK
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <Gallery images={product.images} />

        {/* Details */}
        <div>
          {/* SKU & Badge */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-[#4A7FA5]">{product.sku}</span>
            {product.badge && (
              <Badge color={product.badge === 'BESTSELLER' ? 'gold' : 'cyan'}>{product.badge}</Badge>
            )}
          </div>

          <h1 className="font-heading text-3xl md:text-4xl text-[#E8F4FD] mb-3 leading-tight">
            {product.name}
          </h1>

          <Stars rating={product.rating} count={product.review_count} />

          <p className="text-[#4A7FA5] leading-relaxed mt-4 mb-6">{product.description}</p>

          <Divider className="mb-6" />

          {/* Variants */}
          {activeVariants.length > 0 && (
            <div className="mb-6">
              <p className="font-mono text-xs text-[#4A7FA5] mb-2">SELECT VARIANT</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded border font-mono text-sm transition-all ${
                      variant?.id === v.id
                        ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                        : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.5)]'
                    }`}
                  >
                    {v.label}
                    {v.stock_qty === 0 && <span className="ml-2 text-[#FF3366] text-xs">(sold out)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-mono text-4xl text-[#FFB700] font-bold">
              {fmt(variant?.price ?? 0)}
            </span>
            {variant?.stock_qty > 0 ? (
              <span className="font-mono text-xs text-[#00FF88]">
                {variant.stock_qty} IN STOCK
              </span>
            ) : (
              <span className="font-mono text-xs text-[#FF3366]">OUT OF STOCK</span>
            )}
          </div>

          {/* Qty + CTA */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-[rgba(0,212,255,0.25)] rounded overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono"
              >
                −
              </button>
              <span className="px-4 py-2 font-mono text-[#E8F4FD] border-x border-[rgba(0,212,255,0.25)]">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-heading tracking-widest ${
                inStock ? 'btn-gold' : 'btn-red opacity-60 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={18} />
              {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
            </button>
          </div>

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="hud-card p-5">
              <p className="font-heading text-sm text-[#E8F4FD] tracking-widest mb-4">SPECIFICATIONS</p>
              <div className="space-y-2">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-[#4A7FA5] font-mono">{key}</span>
                    <span className="text-[#E8F4FD] text-right max-w-[60%]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
