'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Truck, Star, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { SectionHeader, NoPhoto } from '@/components/ui'
import { getPrimaryImage, cloudinaryUrl, fmt } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { useRecentlyViewedStore } from '@/store/recently-viewed.store'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

/* ─── Constants ──────────────────────────────────────────────────── */
const DEAL_CATS = [
  { title: 'Amplifiers',     offer: 'Up to 30% off',   slug: 'amplifier' },
  { title: 'Speakers',       offer: 'Starting ₹4,999', slug: 'speaker'   },
  { title: 'Subwoofers',     offer: 'Deep bass deals',  slug: 'subwoofer' },
  { title: 'DSP Processors', offer: 'Starting ₹1,999', slug: 'processor' },
]

const TRUST_BADGES = [
  { icon: <Zap size={20} />,    title: 'Premium Components', desc: 'Audiophile-grade parts' },
  { icon: <Shield size={20} />, title: '2-Year Warranty',    desc: 'No-questions coverage' },
  { icon: <Truck size={20} />,  title: 'Pan-India Shipping', desc: 'Fast & insured delivery' },
  { icon: <Star size={20} />,   title: '4.8★ Rated',         desc: 'Loved by 10,000+ customers' },
]

const ACCENT_COLORS = ['#00D4FF', '#FFB700', '#00FF88', '#A78BFA', '#FF6B6B']

/* ─── Hero Carousel — real products ─────────────────────────────── */
function HeroCarousel() {
  const { data, isLoading } = useProducts({ sort: 'rating', limit: 5 } as Parameters<typeof useProducts>[0])
  const products = data?.data ?? []
  const addItem = useCartStore(s => s.addItem)
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)

  const count = products.length || 1
  const go = (next: number) => { setDir(next > idx ? 1 : -1); setIdx(next) }
  const prev = () => go((idx - 1 + count) % count)
  const next = () => go((idx + 1) % count)

  useEffect(() => {
    if (products.length < 2) return
    const t = setInterval(() => { setDir(1); setIdx(i => (i + 1) % products.length) }, 5000)
    return () => clearInterval(t)
  }, [products.length])

  /* Skeleton while loading */
  if (isLoading || products.length === 0) {
    return (
      <div className="relative w-full hud-grid" style={{ minHeight: 340 }}>
        <div className="max-w-7xl mx-auto px-16 py-14 flex items-center gap-12">
          <div className="flex-1 space-y-4">
            {[24, '3/4', '1/3', '2/3'].map((w, i) => (
              <div key={i} className={`h-${i === 0 ? 4 : i === 2 ? 8 : 6} w-${w} rounded animate-pulse`}
                style={{ background: 'rgba(0,212,255,0.08)' }} />
            ))}
          </div>
          <div className="flex-shrink-0 w-72 h-56 rounded-lg animate-pulse"
            style={{ background: 'rgba(0,212,255,0.06)' }} />
        </div>
      </div>
    )
  }

  const product = products[idx]
  const img = getPrimaryImage(product.images)
  const variant = product.variants.find(v => v.is_active) ?? product.variants[0]
  const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length]
  const inStock = (variant?.stock_qty ?? 0) > 0

  function handleAdd() {
    if (!variant || !inStock) return
    addItem(product, variant)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="relative w-full overflow-hidden hud-grid" style={{ minHeight: 400 }}>
      {/* dynamic radial glow behind product image */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse 60% 80% at 70% 50%, ${accent}12 0%, transparent 70%)` }} />

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={product.id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -80 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative max-w-7xl mx-auto px-12 md:px-16 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8"
        >
          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {product.badge && (
                <span className="font-mono text-[10px] tracking-[0.25em] px-2 py-0.5 rounded border"
                  style={{ color: accent, borderColor: accent + '55', background: accent + '12' }}>
                  {product.badge}
                </span>
              )}
              {product.category && (
                <span className="font-mono text-[10px] text-[#4A7FA5] tracking-widest uppercase">
                  {product.category}
                </span>
              )}
            </div>

            <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl text-[#E8F4FD] tracking-wide leading-tight mb-3">
              {product.name}
            </h2>

            <p className="font-heading text-2xl md:text-3xl mb-4" style={{ color: accent }}>
              {variant ? fmt(variant.price) : '—'}
            </p>

            {product.description && (
              <p className="text-[#A8C8E0] text-sm leading-relaxed mb-6 max-w-md line-clamp-3">
                {product.description}
              </p>
            )}

            {product.rating > 0 && (
              <div className="flex items-center gap-1.5 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13}
                    className={i < Math.round(product.rating) ? 'text-[#FFB700] fill-[#FFB700]' : 'text-[#2A3F55]'} />
                ))}
                <span className="font-mono text-[11px] text-[#4A7FA5] ml-1">({product.review_count})</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={handleAdd} disabled={!inStock}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-heading tracking-wider rounded transition-all disabled:opacity-40"
                style={{ border: `1px solid ${accent}`, color: accent, background: accent + '10' }}>
                <ShoppingCart size={15} />
                {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
              </button>
              <Link href={`/products/${product.slug}`}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-heading tracking-wider rounded border border-[rgba(0,212,255,0.2)] text-[#A8C8E0] hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all">
                VIEW DETAILS <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right: product image */}
          <div className="flex-shrink-0 relative w-64 h-56 md:w-96 md:h-80 rounded-lg overflow-hidden"
            style={{ border: `1px solid ${accent}30`, background: accent + '08' }}>
            {[['top-0 left-0','border-t border-l'],['top-0 right-0','border-t border-r'],
              ['bottom-0 left-0','border-b border-l'],['bottom-0 right-0','border-b border-r']].map(([p,b]) => (
              <div key={p} className={`absolute ${p} w-5 h-5 ${b} z-10`} style={{ borderColor: accent }} />
            ))}
            {img
              ? <Image src={cloudinaryUrl(img.url, 800)} alt={product.name} fill
                  className="object-contain p-2" sizes="(max-width:768px) 256px, 384px" priority />
              : <NoPhoto className="w-full h-full" />
            }
            {/* price tag on image */}
            {variant && (
              <div className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded font-mono text-xs font-bold"
                style={{ background: 'rgba(10,14,26,0.88)', color: accent, border: `1px solid ${accent}45` }}>
                {fmt(variant.price)}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.25)] bg-[rgba(13,27,42,0.85)] text-[#00D4FF] hover:border-[#00D4FF] transition-colors z-10">
        <ChevronLeft size={18} />
      </button>
      <button onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.25)] bg-[rgba(13,27,42,0.85)] text-[#00D4FF] hover:border-[#00D4FF] transition-colors z-10">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {products.map((_, i) => (
          <button key={i} onClick={() => go(i)} className="rounded-full transition-all duration-300"
            style={{ width: i === idx ? 20 : 6, height: 6,
              background: i === idx ? accent : 'rgba(0,212,255,0.2)' }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Deal Card ──────────────────────────────────────────────────── */
function DealCard({ title, offer, slug, delay }: { title: string; offer: string; slug: string; delay: number }) {
  const { data, isLoading } = useProducts({ category: slug, limit: 4 } as Parameters<typeof useProducts>[0])
  const products = data?.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.5, delay }}
      className="hud-card p-4 flex flex-col"
      style={{ background: 'rgba(13,27,42,0.95)' }}
    >
      <div className="mb-3">
        <h3 className="font-heading text-base text-[#E8F4FD] tracking-wide leading-tight">{title}</h3>
        <p className="text-[#00D4FF] text-xs font-mono tracking-wider mt-0.5">{offer}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded animate-pulse"
                style={{ background: 'rgba(0,212,255,0.06)' }} />
            ))
          : products.slice(0, 4).map(product => {
              const img = getPrimaryImage(product.images)
              const variant = product.variants.find(v => v.is_active) ?? product.variants[0]
              return (
                <Link key={product.id} href={`/products/${product.slug}`}
                  className="group flex flex-col gap-1 hover:opacity-90 transition-opacity">
                  <div className="relative aspect-square rounded overflow-hidden"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    {img
                      ? <Image src={cloudinaryUrl(img.url, 200)} alt={product.name} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="120px" />
                      : <NoPhoto className="w-full h-full" />
                    }
                  </div>
                  <p className="font-mono text-[9px] text-[#A8C8E0] leading-tight line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
                    {product.name}
                  </p>
                  {variant && (
                    <p className="font-mono text-[9px] text-[#FFB700]">{fmt(variant.price)}</p>
                  )}
                </Link>
              )
            })
        }
      </div>

      <Link href={`/products?category=${slug}`}
        className="flex items-center gap-1 text-[#00D4FF] font-mono text-[11px] tracking-wider mt-3 hover:gap-2 transition-all">
        See all <ChevronRight size={11} />
      </Link>
    </motion.div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { data: bestsellers, isLoading } = useProducts({ sort: 'rating', limit: 8 })
  const recentlyViewed = useRecentlyViewedStore((s) => s.items)

  return (
    <div>
      <HeroCarousel />

      {/* Trust strip */}
      <div className="border-b border-[rgba(0,212,255,0.12)] bg-[rgba(13,27,42,0.7)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(b => (
              <div key={b.title} className="flex items-center gap-2.5">
                <div className="text-[#00D4FF] flex-shrink-0">{b.icon}</div>
                <div>
                  <p className="font-heading text-xs text-[#E8F4FD] tracking-wide">{b.title}</p>
                  <p className="text-[10px] text-[#7EB8D4] mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4-column deal cards */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DEAL_CATS.map((cat, i) => (
            <DealCard key={cat.slug} title={cat.title} offer={cat.offer} slug={cat.slug} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 py-10 border-t border-[rgba(0,212,255,0.1)]">
        <SectionHeader title="BESTSELLERS" subtitle="Our most loved products by audiophiles across India" />
        <ProductsGrid products={bestsellers?.data} isLoading={isLoading} />
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-gold px-10 py-3 text-base">VIEW ALL PRODUCTS</Link>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 border-t border-[rgba(0,212,255,0.1)]">
          <SectionHeader title="RECENTLY VIEWED" subtitle="Pick up where you left off" />
          <ProductsGrid products={recentlyViewed} />
        </section>
      )}
    </div>
  )
}
