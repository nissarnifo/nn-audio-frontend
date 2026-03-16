'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Zap, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/types'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { Stars, Badge, NoPhoto } from '@/components/ui'
import toast from 'react-hot-toast'

const BADGE_COLORS: Record<string, 'cyan' | 'gold' | 'green' | 'red'> = {
  BESTSELLER: 'gold',
  'TOP RATED': 'cyan',
  NEW: 'green',
  PRO: 'cyan',
  FLAGSHIP: 'gold',
}

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = getPrimaryImage(product.images)
  const defaultVariant = product.variants.find((v) => v.is_active) ?? product.variants[0]
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant)
  const addItem = useCartStore((s) => s.addItem)
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore()
  const wishlisted = inWishlist(product.id)

  const inStock = selectedVariant?.stock_qty > 0

  function handleAdd() {
    if (!selectedVariant || !inStock) return
    addItem(product, selectedVariant)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hud-card overflow-hidden group"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-[#0D1B2A]">
        {primaryImage ? (
          <Image
            src={cloudinaryUrl(primaryImage.url)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <NoPhoto className="w-full h-full" />
        )}
        {/* Badge overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.on_sale && <Badge color="red">SALE</Badge>}
          {product.badge && !product.on_sale && (
            <Badge color={BADGE_COLORS[product.badge] ?? 'cyan'}>{product.badge}</Badge>
          )}
        </div>
        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(10,14,26,0.7)] flex items-center justify-center transition-all hover:scale-110"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={15}
            className={wishlisted ? 'fill-[#FF3366] text-[#FF3366]' : 'text-[#4A7FA5]'}
          />
        </button>
        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-[rgba(10,14,26,0.7)] flex items-center justify-center">
            <Badge color="red">OUT OF STOCK</Badge>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="font-mono text-[10px] text-[#4A7FA5] mb-1 tracking-widest">{product.sku}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading text-base text-[#E8F4FD] hover:text-[#00D4FF] transition-colors line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
        </Link>
        <Stars rating={product.rating} count={product.review_count} />

        {/* Variants */}
        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.variants.filter((v) => v.is_active).map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors ${
                  selectedVariant?.id === v.id
                    ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                    : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[#00D4FF]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-4">
          <div>
            {product.on_sale && product.sale_price != null ? (
              <>
                <span className="font-mono text-lg text-[#FF3366] font-bold">{fmt(product.sale_price)}</span>
                <span className="font-mono text-xs text-[#4A7FA5] line-through ml-2">{fmt(selectedVariant?.price ?? 0)}</span>
                <span className="font-mono text-[10px] text-[#00FF88] ml-1">
                  -{Math.round((1 - product.sale_price / (selectedVariant?.price ?? 1)) * 100)}%
                </span>
              </>
            ) : (
              <span className="font-mono text-lg text-[#FFB700] font-bold">
                {fmt(selectedVariant?.price ?? 0)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading tracking-wide transition-all ${
              inStock
                ? 'btn-cyan'
                : 'border border-[rgba(255,51,102,0.3)] text-[#FF3366] cursor-not-allowed opacity-60'
            }`}
          >
            {inStock ? (
              <>
                <ShoppingCart size={13} />
                ADD
              </>
            ) : (
              <>
                <Zap size={13} />
                SOLD OUT
              </>
            )}
          </button>
        </div>
        {/* Sale countdown */}
        {product.on_sale && product.sale_end_at && (
          <p className="font-mono text-[10px] text-[#FF3366] mt-1.5">
            ⏱ Ends {new Date(product.sale_end_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    </motion.div>
  )
}
