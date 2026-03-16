'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, ChevronLeft, Zap, Star, Heart, Bell, Timer, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useProduct, useProductReviews, useCreateReview, useProducts, useProductQuestions, useSubmitQuestion, useWishlist } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import Gallery from '@/components/product/Gallery'
import { Stars, Badge, PageLoading, Divider, Spinner } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { useRecentlyViewedStore } from '@/store/recently-viewed.store'
import { stockAlertsApi } from '@/services/api'
import ProductsGrid from '@/components/product/ProductsGrid'
import type { ProductVariant } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter()
  const { data: product, isLoading } = useProduct(slug)
  const { data: reviews = [] } = useProductReviews(slug)
  const { mutateAsync: submitReview, isPending: isSubmitting } = useCreateReview(slug)
  const { data: questions = [] } = useProductQuestions(slug)
  const { mutateAsync: submitQuestion, isPending: isQuestionPending } = useSubmitQuestion(slug)
  const { isLoggedIn } = useAuthStore()
  const addItem = useCartStore((s) => s.addItem)
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist()
  const record = useRecentlyViewedStore((s) => s.record)

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyPending, setNotifyPending] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [expandedQ, setExpandedQ] = useState<string | null>(null)

  useEffect(() => {
    if (product) record(product)
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for flash sale
  useEffect(() => {
    if (!product?.on_sale || !product.sale_end_at) { setTimeLeft(null); return }
    const calc = () => {
      const diff = new Date(product.sale_end_at!).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft(null); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ d, h, m, s })
    }
    calc()
    timerRef.current = setInterval(calc, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [product?.on_sale, product?.sale_end_at])

  // Reset notify state when variant changes
  useEffect(() => {
    setNotifyDone(false)
  }, [selectedVariant?.id])

  const { data: relatedData } = useProducts(
    product ? { category: product.category, limit: 5 } : undefined
  )
  const related = relatedData?.data?.filter((p) => p.id !== product?.id).slice(0, 4) ?? []

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

  async function handleNotify(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!variant) return
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(notifyEmail)) { toast.error('Enter a valid email address'); return }
    setNotifyPending(true)
    try {
      await stockAlertsApi.subscribe({ email: notifyEmail, variantId: variant.id })
      setNotifyDone(true)
      setNotifyEmail('')
      toast.success("We'll notify you when it's back in stock!")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to subscribe')
    } finally {
      setNotifyPending(false)
    }
  }

  async function handleReviewSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a star rating'); return }
    if (!comment.trim()) { toast.error('Please write a comment'); return }
    await submitReview({ rating, comment: comment.trim() })
    setRating(0)
    setComment('')
  }

  async function handleQuestionSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!questionText.trim()) { toast.error('Please enter your question'); return }
    await submitQuestion({ question: questionText.trim() })
    setQuestionText('')
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

          {/* Flash sale banner */}
          {product.on_sale && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded border border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.06)]">
              <Timer size={13} className="text-[#FF3366] flex-shrink-0" />
              <span className="font-mono text-xs text-[#FF3366] font-bold">FLASH SALE</span>
              {timeLeft && (
                <span className="font-mono text-xs text-[#E8F4FD] ml-auto">
                  {timeLeft.d > 0 && `${timeLeft.d}d `}{String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            {product.on_sale && product.sale_price != null ? (
              <>
                <span className="font-mono text-4xl text-[#FF3366] font-bold">{fmt(product.sale_price)}</span>
                <span className="font-mono text-xl text-[#4A7FA5] line-through">{fmt(variant?.price ?? 0)}</span>
                <span className="font-mono text-sm text-[#00FF88]">
                  -{Math.round((1 - product.sale_price / (variant?.price ?? 1)) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="font-mono text-4xl text-[#FFB700] font-bold">
                {fmt(variant?.price ?? 0)}
              </span>
            )}
            {variant?.stock_qty > 0 ? (
              <span className="font-mono text-xs text-[#00FF88]">{variant.stock_qty} IN STOCK</span>
            ) : (
              <span className="font-mono text-xs text-[#FF3366]">OUT OF STOCK</span>
            )}
          </div>

          {inStock ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center border border-[rgba(0,212,255,0.25)] rounded overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono">−</button>
                  <span className="px-4 py-2 font-mono text-[#E8F4FD] border-x border-[rgba(0,212,255,0.25)]">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors font-mono">+</button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-heading tracking-widest btn-gold"
                >
                  <ShoppingCart size={18} />
                  ADD TO CART
                </button>
              </div>
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-heading tracking-widest btn-cyan"
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
            </>
          ) : (
            <div className="mb-8">
              <p className="font-mono text-sm text-[#FF3366] mb-4">⚠ This variant is currently out of stock.</p>
              {notifyDone ? (
                <div className="flex items-center gap-2 p-4 border border-[rgba(0,255,136,0.3)] rounded bg-[rgba(0,255,136,0.05)] text-[#00FF88] font-mono text-sm">
                  <Bell size={16} />
                  You&apos;re on the list! We&apos;ll email you when it&apos;s back.
                </div>
              ) : (
                <form onSubmit={handleNotify} className="flex gap-2">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.25)] rounded px-3 py-2.5 font-mono text-sm text-[#E8F4FD] placeholder-[#4A7FA5] focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={notifyPending}
                    className="flex items-center gap-2 px-4 py-2.5 font-heading tracking-widest text-sm btn-cyan whitespace-nowrap"
                  >
                    {notifyPending ? <Spinner size={14} /> : <Bell size={14} />}
                    NOTIFY ME
                  </button>
                </form>
              )}
            </div>
          )}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="hud-card p-5">
              <p className="font-heading text-sm text-[#E8F4FD] tracking-widest mb-4">SPECIFICATIONS</p>
              <div className="space-y-2">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-[#4A7FA5] font-mono">{key}</span>
                    <span className="text-[#E8F4FD] text-right max-w-[60%]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl text-[#E8F4FD] tracking-wider mb-2">RELATED PRODUCTS</h2>
          <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />
          <ProductsGrid products={related} />
        </div>
      )}

      {/* Q&A */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl text-[#E8F4FD] tracking-wider mb-2">
          Q&amp;A
          {questions.length > 0 && <span className="font-mono text-sm text-[#4A7FA5] ml-3">({questions.length})</span>}
        </h2>
        <div className="h-0.5 w-10 bg-[#FFB700] mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ask form */}
          <div className="hud-card p-6 h-fit">
            <p className="font-heading text-base text-[#E8F4FD] tracking-wider mb-5 flex items-center gap-2">
              <MessageCircle size={16} className="text-[#FFB700]" /> ASK A QUESTION
            </p>
            {isLoggedIn ? (
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={3}
                  placeholder="What would you like to know about this product?"
                  className="input-hud w-full resize-none"
                />
                <button type="submit" disabled={isQuestionPending}
                  className="btn-gold w-full py-2.5 flex items-center justify-center gap-2">
                  {isQuestionPending ? <><Spinner size={15} /> SUBMITTING...</> : 'SUBMIT QUESTION'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#4A7FA5] text-sm mb-4">Sign in to ask a question</p>
                <Link href="/auth/login" className="btn-cyan">SIGN IN</Link>
              </div>
            )}
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="hud-card p-8 text-center">
                <p className="font-heading text-lg text-[#4A7FA5]">No questions yet.</p>
                <p className="text-sm text-[#4A7FA5] mt-1">Be the first to ask about this product.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="hud-card overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                    className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-[rgba(0,212,255,0.02)] transition-colors"
                  >
                    <div className="flex gap-2 flex-1">
                      <span className="font-mono text-xs text-[#FFB700] mt-0.5 flex-shrink-0">Q</span>
                      <span className="font-mono text-sm text-[#E8F4FD]">{q.question}</span>
                    </div>
                    {expandedQ === q.id ? <ChevronUp size={14} className="text-[#4A7FA5] flex-shrink-0 mt-0.5" /> : <ChevronDown size={14} className="text-[#4A7FA5] flex-shrink-0 mt-0.5" />}
                  </button>
                  {expandedQ === q.id && q.answer && (
                    <div className="border-t border-[rgba(0,212,255,0.08)] px-4 py-3 flex gap-2">
                      <span className="font-mono text-xs text-[#00D4FF] mt-0.5 flex-shrink-0">A</span>
                      <p className="font-mono text-sm text-[#4A7FA5] leading-relaxed">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl text-[#E8F4FD] tracking-wider mb-2">
          REVIEWS
          {reviews.length > 0 && <span className="font-mono text-sm text-[#4A7FA5] ml-3">({reviews.length})</span>}
        </h2>
        <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="hud-card p-6 h-fit">
            <p className="font-heading text-base text-[#E8F4FD] tracking-wider mb-5">WRITE A REVIEW</p>
            {isLoggedIn ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-[#4A7FA5] mb-2">YOUR RATING</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setRating(i)}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                        className="transition-transform hover:scale-110">
                        <Star size={28} className={i <= (hover || rating) ? 'fill-[#FFB700] text-[#FFB700]' : 'text-[#4A7FA5]'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-xs text-[#4A7FA5] mb-2">YOUR COMMENT</p>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    rows={4} placeholder="Share your experience with this product..."
                    className="input-hud w-full resize-none" />
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="btn-gold w-full py-2.5 flex items-center justify-center gap-2">
                  {isSubmitting ? <><Spinner size={15} /> SUBMITTING...</> : 'SUBMIT REVIEW'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#4A7FA5] text-sm mb-4">Sign in to leave a review</p>
                <Link href="/auth/login" className="btn-cyan">SIGN IN</Link>
              </div>
            )}
          </div>

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
