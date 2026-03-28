'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { X, ShoppingCart, Zap, Heart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/types'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useWishlist } from '@/hooks'
import { Stars, Badge, NoPhoto } from '@/components/ui'
import toast from 'react-hot-toast'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function QuickViewModal({ product, onClose }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants.find((v) => v.is_active) ?? product?.variants[0] ?? null
  )
  const [qty, setQty] = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore((s) => s.addItem)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const router = useRouter()
  const pathname = usePathname()
  const { toggle: toggleWishlist, has } = useWishlist()

  // Reset state when product changes
  useEffect(() => {
    if (!product) return
    setSelectedVariant(product.variants.find((v) => v.is_active) ?? product.variants[0] ?? null)
    setQty(1)
    setImgIdx(0)
  }, [product?.id])

  // Focus trap + Escape to close
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    // Focus first focusable element on open
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!product) return null

  const images  = product.images.sort((a, b) => a.order - b.order)
  const current = images[imgIdx]
  const inStock = (selectedVariant?.stock_qty ?? 0) > 0
  const wishlisted = has(product.id)

  const price = product.on_sale && product.sale_price != null
    ? product.sale_price
    : (selectedVariant?.price ?? 0)

  const originalPrice = selectedVariant?.price ?? 0
  const discount = product.on_sale && product.sale_price != null
    ? Math.round((1 - product.sale_price / originalPrice) * 100)
    : 0

  function handleAdd() {
    if (!selectedVariant || !inStock) return
    if (!isLoggedIn) {
      onClose()
      router.push(`/auth/login?from=${encodeURIComponent(pathname)}`)
      return
    }
    addItem(product!, selectedVariant, qty)
    toast.success(`${product!.name} added to cart`)
    onClose()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative w-full max-w-3xl bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(13,27,42,0.8)] flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] hover:border-[rgba(0,212,255,0.5)] transition-all"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* ── Gallery ── */}
          <div className="md:w-[45%] flex-shrink-0 relative bg-[#0A0E1A]">
            <div className="relative aspect-square">
              {current ? (
                <Image
                  src={cloudinaryUrl(current.url, 600)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              ) : (
                <NoPhoto className="w-full h-full" />
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.on_sale && <Badge color="red">SALE</Badge>}
                {product.badge && !product.on_sale && (
                  <Badge color="cyan">{product.badge}</Badge>
                )}
              </div>

              {/* Prev / Next */}
              {images.length > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[rgba(10,14,26,0.7)] flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] transition-all"
                  >
                    <ChevronLeft size={15} aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[rgba(10,14,26,0.7)] flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] transition-all"
                  >
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-1.5 p-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImgIdx(i)}
                    className={`flex-shrink-0 w-12 h-12 rounded border overflow-hidden transition-all ${
                      i === imgIdx ? 'border-[#00D4FF]' : 'border-[rgba(0,212,255,0.15)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={cloudinaryUrl(img.url, 100)} alt={`Thumbnail ${i + 1}`} width={48} height={48} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[80vh]">
            <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-1">{product.sku}</p>
            <h2 className="font-heading text-xl text-[#E8F4FD] leading-snug mb-2">{product.name}</h2>
            <Stars rating={product.rating} count={product.review_count} />

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-4 mb-4">
              <span className={`font-mono text-2xl font-bold ${product.on_sale ? 'text-[#FF3366]' : 'text-[#FFB700]'}`}>
                {fmt(price)}
              </span>
              {discount > 0 && (
                <>
                  <span className="font-mono text-sm text-[#4A7FA5] line-through">{fmt(originalPrice)}</span>
                  <span className="font-mono text-xs text-[#00FF88]">-{discount}%</span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="font-mono text-xs text-[#4A7FA5] leading-relaxed mb-4 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants.length > 1 && (
              <div className="mb-4">
                <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-2">VARIANT</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.filter((v) => v.is_active).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded border font-mono text-xs transition-all ${
                        selectedVariant?.id === v.id
                          ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                          : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[#00D4FF]'
                      }`}
                    >
                      {v.label}
                      {v.stock_qty === 0 && <span className="ml-1 opacity-50">(sold out)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-3 mb-5">
              <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest">QTY</p>
              <div className="flex items-center border border-[rgba(0,212,255,0.2)] rounded overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] hover:bg-[rgba(0,212,255,0.06)] transition-all font-mono text-lg"
                >−</button>
                <span className="w-10 text-center font-mono text-sm text-[#E8F4FD]">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(selectedVariant?.stock_qty ?? 99, q + 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#4A7FA5] hover:text-[#E8F4FD] hover:bg-[rgba(0,212,255,0.06)] transition-all font-mono text-lg"
                >+</button>
              </div>
              {selectedVariant && (
                <span className="font-mono text-[10px] text-[#4A7FA5]">{selectedVariant.stock_qty} in stock</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleAdd}
                disabled={!inStock}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-heading tracking-widest text-sm rounded transition-all ${
                  inStock ? 'btn-gold' : 'border border-[rgba(255,51,102,0.3)] text-[#FF3366] opacity-60 cursor-not-allowed'
                }`}
              >
                {inStock ? <><ShoppingCart size={15} /> ADD TO CART</> : <><Zap size={15} /> SOLD OUT</>}
              </button>
              <button
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggleWishlist(product)}
                className={`w-11 flex items-center justify-center border rounded transition-all ${
                  wishlisted
                    ? 'border-[#FF3366] bg-[rgba(255,51,102,0.08)] text-[#FF3366]'
                    : 'border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#FF3366] hover:text-[#FF3366]'
                }`}
              >
                <Heart size={16} aria-hidden="true" className={wishlisted ? 'fill-[#FF3366]' : ''} />
              </button>
            </div>

            {/* View full details */}
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="flex items-center gap-1.5 font-mono text-xs text-[#4A7FA5] hover:text-[#00D4FF] transition-colors"
            >
              <ExternalLink size={12} />
              VIEW FULL DETAILS
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
