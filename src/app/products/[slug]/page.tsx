'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingCart, ChevronLeft, Zap, Star, Heart } from 'lucide-react'
import { useProduct, useProductReviews, useCreateReview } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import Gallery from '@/components/product/Gallery'
import { Stars, StatusBadge, Badge, PageLoading, Divider, Spinner } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import type { ProductVariant } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: product, isLoading } = useProduct(slug)
  const { data: reviews = [] } = useProductReviews(slug)
  const { mutateAsync: submitReview, isPending: isSubmitting } = useCreateReview(slug)
  const { isLoggedIn } = useAuthStore()
  const addItem = useCartStore((s) => s.addItem)
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)

  // Review form state
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

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

  function handleBuyNow() {
    if (!variant) return
    addItem(product!, variant, qty)
    router.push('/checkout')
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a star rating'); return }
    if (!comment.trim()) { toast.error('Please write a comment'); return }
    await submitReview({ rating, comment: comment.trim() })
    setRating(0)
    setComment('')
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
          <div className="flex items-center gap-4 mb-4">
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

          {/* Buy Now + Wishlist */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-heading tracking-widest ${
                inStock ? 'btn-cyan' : 'opacity-40 cursor-not-allowed border border-[rgba(0,212,255,0.2)] text-[#4A7FA5]'
              }`}
            >
              <Zap size={18} />
              BUY NOW
            </button>
            <button
              onClick={() => toggleWishlist(product!)}
              className={`w-12 flex items-center justify-center border rounded transition-all ${
                inWishlist(product!.id)
                  ? 'border-[#FF3366] bg-[rgba(255,51,102,0.08)] text-[#FF3366]'
                  : 'border-[rgba(0,212,255,0.25)] text-[#4A7FA5] hover:border-[#FF3366] hover:text-[#FF3366]'
              }`}
              aria-label={inWishlist(product!.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={inWishlist(product!.id) ? 'fill-[#FF3366]' : ''} />
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

      {/* ── Reviews Section ───────────────────────────────────────── */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl text-[#E8F4FD] tracking-wider mb-2">
          REVIEWS
          {reviews.length > 0 && (
            <span className="font-mono text-sm text-[#4A7FA5] ml-3">({reviews.length})</span>
          )}
        </h2>
        <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Write a review */}
          <div className="hud-card p-6 h-fit">
            <p className="font-heading text-base text-[#E8F4FD] tracking-wider mb-5">WRITE A REVIEW</p>

            {isLoggedIn ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star picker */}
                <div>
                  <p className="font-mono text-xs text-[#4A7FA5] mb-2">YOUR RATING</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={
                            i <= (hover || rating)
                              ? 'fill-[#FFB700] text-[#FFB700]'
                              : 'text-[#4A7FA5]'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <p className="font-mono text-xs text-[#4A7FA5] mb-2">YOUR COMMENT</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Share your experience with this product..."
                    className="input-hud w-full resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full py-2.5 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Spinner size={15} /> SUBMITTING...</> : 'SUBMIT REVIEW'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#4A7FA5] text-sm mb-4">Sign in to leave a review</p>
                <Link href="/auth/login" className="btn-cyan">
                  SIGN IN
                </Link>
              </div>
            )}
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="hud-card p-8 text-center">
                <p className="font-heading text-lg text-[#4A7FA5]">No reviews yet.</p>
                <p className="text-sm text-[#4A7FA5] mt-1">Be the first to review this product.</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="hud-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#E8F4FD] font-mono">{r.user_name}</span>
                    <span className="font-mono text-xs text-[#4A7FA5]">{fmtDate(r.created_at)}</span>
                  </div>
                  <Stars rating={r.rating} />
                  <p className="text-sm text-[#4A7FA5] mt-2 leading-relaxed">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
