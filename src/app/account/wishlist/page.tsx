'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { useCartStore } from '@/store/cart.store'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { NoPhoto, Stars } from '@/components/ui'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore()
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart(product: Product) {
    const variant = product.variants.find((v) => v.is_active && v.stock_qty > 0)
      ?? product.variants.find((v) => v.is_active)
    if (!variant) { toast.error('No variants available'); return }
    addItem(product, variant)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">WISHLIST</h1>
          <div className="h-0.5 w-12 bg-[#FF3366]" />
        </div>
        {items.length > 0 && (
          <button
            onClick={() => { if (confirm('Clear entire wishlist?')) clear() }}
            className="font-mono text-xs text-[#4A7FA5] hover:text-[#FF3366] transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} /> CLEAR ALL
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="hud-card p-16 text-center">
          <Heart size={40} className="text-[rgba(255,51,102,0.3)] mx-auto mb-4" />
          <p className="font-heading text-xl text-[#4A7FA5] tracking-widest mb-2">YOUR WISHLIST IS EMPTY</p>
          <p className="font-mono text-xs text-[#4A7FA5] mb-6">Save products you love by clicking the heart icon</p>
          <Link href="/products" className="btn-cyan px-6 py-2.5 font-heading tracking-widest text-sm">
            BROWSE PRODUCTS
          </Link>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-[#4A7FA5] mb-6">
            {items.length} SAVED ITEM{items.length !== 1 ? 'S' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((product) => {
              const primaryImage = getPrimaryImage(product.images)
              const defaultVariant = product.variants.find((v) => v.is_active) ?? product.variants[0]
              const inStock = product.variants.some((v) => v.is_active && v.stock_qty > 0)

              return (
                <div key={product.id} className="hud-card overflow-hidden group">
                  {/* Image */}
                  <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-[#0D1B2A]">
                    {primaryImage ? (
                      <Image
                        src={cloudinaryUrl(primaryImage.url)}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <NoPhoto className="w-full h-full" />
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 bg-[rgba(10,14,26,0.7)] flex items-center justify-center">
                        <span className="font-mono text-xs text-[#FF3366] border border-[#FF3366] px-3 py-1 rounded">OUT OF STOCK</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-mono text-[10px] text-[#4A7FA5] mb-1 tracking-widest">{product.sku}</p>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-heading text-sm text-[#E8F4FD] hover:text-[#00D4FF] transition-colors line-clamp-2 leading-snug mb-2">
                        {product.name}
                      </h3>
                    </Link>
                    <Stars rating={product.rating} count={product.review_count} />
                    <p className="font-mono text-base text-[#FFB700] font-bold mt-3">
                      {fmt(defaultVariant?.price ?? 0)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!inStock}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-heading tracking-wide transition-all rounded ${
                          inStock ? 'btn-cyan' : 'opacity-40 cursor-not-allowed border border-[rgba(0,212,255,0.2)] text-[#4A7FA5]'
                        }`}
                      >
                        <ShoppingCart size={13} />
                        {inStock ? 'ADD TO CART' : 'SOLD OUT'}
                      </button>
                      <button
                        onClick={() => remove(product.id)}
                        className="w-9 flex items-center justify-center border border-[rgba(255,51,102,0.25)] text-[#4A7FA5] hover:border-[#FF3366] hover:text-[#FF3366] rounded transition-all"
                        aria-label="Remove from wishlist"
                      >
                        <Heart size={14} className="fill-[#FF3366] text-[#FF3366]" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
