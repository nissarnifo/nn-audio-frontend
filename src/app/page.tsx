'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Truck, Star, ChevronRight, ChevronLeft } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { SectionHeader } from '@/components/ui'
import { useState, useEffect } from 'react'

/* ─── Hero Slides ────────────────────────────────────────────────── */
const SLIDES = [
  {
    tag: 'NEW LAUNCH',
    heading: 'Pro Series Mono Amplifier',
    sub: 'Starting ₹12,999',
    badges: ['2000W RMS', 'Class A/B', 'THD < 0.005%'],
    slug: '/products?category=amplifier',
    cta: 'SHOP AMPLIFIERS',
    icon: '⚡',
    accent: '#00D4FF',
    bg: 'from-[#00D4FF]/10 via-transparent to-transparent',
  },
  {
    tag: 'BESTSELLER',
    heading: 'Component Speaker Sets',
    sub: 'Starting ₹4,999',
    badges: ['Silk-dome tweeter', '4Ω impedance', '20Hz – 20kHz'],
    slug: '/products?category=speaker',
    cta: 'SHOP SPEAKERS',
    icon: '🔊',
    accent: '#FFB700',
    bg: 'from-[#FFB700]/10 via-transparent to-transparent',
  },
  {
    tag: 'HOT DEAL',
    heading: 'Deep Bass Subwoofers',
    sub: 'Up to 20% off',
    badges: ['12" & 15" drivers', 'Dual voice coil', 'High excursion'],
    slug: '/products?category=subwoofer',
    cta: 'SHOP SUBWOOFERS',
    icon: '🎵',
    accent: '#00FF88',
    bg: 'from-[#00FF88]/8 via-transparent to-transparent',
  },
]

/* ─── Deal Cards ─────────────────────────────────────────────────── */
const DEALS = [
  {
    title: 'Amplifiers',
    offer: 'Up to 30% off',
    slug: 'amplifier',
    subs: [
      { label: 'Mono Amps',   icon: '⚡', color: '#00D4FF' },
      { label: '4-Channel',   icon: '🔌', color: '#7EB8D4' },
      { label: 'Class D',     icon: '🔋', color: '#00D4FF' },
      { label: 'Mini Amps',   icon: '📦', color: '#7EB8D4' },
    ],
  },
  {
    title: 'Speakers',
    offer: 'Starting ₹4,999',
    slug: 'speaker',
    subs: [
      { label: 'Component',   icon: '🔊', color: '#FFB700' },
      { label: 'Coaxial',     icon: '🎙️', color: '#D4A000' },
      { label: 'Tweeters',    icon: '📢', color: '#FFB700' },
      { label: 'Door Panels', icon: '🚪', color: '#D4A000' },
    ],
  },
  {
    title: 'Subwoofers',
    offer: 'Deep bass deals',
    slug: 'subwoofer',
    subs: [
      { label: '12" Subs',    icon: '🎵', color: '#00FF88' },
      { label: '15" Subs',    icon: '💥', color: '#00CC66' },
      { label: 'Dual VC',     icon: '🎛️', color: '#00FF88' },
      { label: 'Shallow',     icon: '📐', color: '#00CC66' },
    ],
  },
  {
    title: 'DSP Processors',
    offer: 'Starting ₹1,999',
    slug: 'processor',
    subs: [
      { label: '4-Ch DSP',    icon: '🎛️', color: '#A78BFA' },
      { label: '8-Ch DSP',    icon: '🖥️', color: '#7C6BE0' },
      { label: 'BT Control',  icon: '📡', color: '#A78BFA' },
      { label: 'EQ Units',    icon: '🎚️', color: '#7C6BE0' },
    ],
  },
]

const TRUST_BADGES = [
  { icon: <Zap size={20} />,    title: 'Premium Components', desc: 'Audiophile-grade parts' },
  { icon: <Shield size={20} />, title: '2-Year Warranty',    desc: 'No-questions coverage' },
  { icon: <Truck size={20} />,  title: 'Pan-India Shipping', desc: 'Fast & insured delivery' },
  { icon: <Star size={20} />,   title: '4.8★ Rated',         desc: 'Loved by 10,000+ customers' },
]

/* ─── Hero Carousel ──────────────────────────────────────────────── */
function HeroCarousel() {
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)

  const go = (next: number) => {
    setDir(next > idx ? 1 : -1)
    setIdx(next)
  }
  const prev = () => go((idx - 1 + SLIDES.length) % SLIDES.length)
  const next = () => go((idx + 1) % SLIDES.length)

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1)
      setIdx(i => (i + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[idx]

  return (
    <div className="relative w-full overflow-hidden hud-grid" style={{ minHeight: 340 }}>
      {/* bg gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} transition-all duration-700 pointer-events-none`} />

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={idx}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -80 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="relative max-w-7xl mx-auto px-16 py-14 flex flex-col md:flex-row items-center gap-8 md:gap-0"
        >
          {/* Text side */}
          <div className="flex-1">
            <span
              className="font-mono text-[10px] tracking-[0.3em] px-2 py-1 rounded mb-4 inline-block border"
              style={{ color: slide.accent, borderColor: slide.accent + '55', background: slide.accent + '11' }}
            >
              {slide.tag}
            </span>
            <h2 className="font-heading text-3xl md:text-5xl text-[#E8F4FD] tracking-wide leading-tight mb-2">
              {slide.heading}
            </h2>
            <p className="font-heading text-2xl md:text-3xl mb-6" style={{ color: slide.accent }}>
              {slide.sub}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {slide.badges.map(b => (
                <span key={b} className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[#A8C8E0]">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.accent }} />
                  {b}
                </span>
              ))}
            </div>
            <Link
              href={slide.slug}
              className="btn-cyan px-8 py-3 text-sm inline-block"
              style={{ borderColor: slide.accent, color: slide.accent }}
            >
              {slide.cta}
            </Link>
          </div>

          {/* Icon / Product side */}
          <div className="flex-shrink-0 flex items-center justify-center w-56 h-48 md:w-72 md:h-56 rounded-lg relative"
            style={{ border: `1px solid ${slide.accent}33`, background: slide.accent + '08' }}>
            {/* HUD corners */}
            {[['top-0 left-0','border-t border-l'],['top-0 right-0','border-t border-r'],
              ['bottom-0 left-0','border-b border-l'],['bottom-0 right-0','border-b border-r']].map(([p,b]) => (
              <div key={p} className={`absolute ${p} w-4 h-4 ${b}`} style={{ borderColor: slide.accent }} />
            ))}
            <span className="text-8xl md:text-9xl">{slide.icon}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.25)] bg-[rgba(13,27,42,0.8)] text-[#00D4FF] hover:border-[#00D4FF] transition-colors z-10">
        <ChevronLeft size={18} />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded border border-[rgba(0,212,255,0.25)] bg-[rgba(13,27,42,0.8)] text-[#00D4FF] hover:border-[#00D4FF] transition-colors z-10">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 20 : 6, height: 6,
              background: i === idx ? '#00D4FF' : 'rgba(0,212,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Deal Card ──────────────────────────────────────────────────── */
function DealCard({ deal, delay }: { deal: typeof DEALS[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.5, delay }}
      className="hud-card p-4 flex flex-col"
      style={{ background: 'rgba(13,27,42,0.95)' }}
    >
      {/* Card header */}
      <div className="mb-3">
        <h3 className="font-heading text-base text-[#E8F4FD] tracking-wide leading-tight">{deal.title}</h3>
        <p className="text-[#00D4FF] text-xs font-mono tracking-wider mt-0.5">{deal.offer}</p>
      </div>

      {/* 2×2 sub-category grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {deal.subs.map(sub => (
          <div
            key={sub.label}
            className="rounded flex flex-col items-center justify-center gap-1.5 py-4 cursor-pointer transition-all hover:scale-[1.03]"
            style={{ background: sub.color + '10', border: `1px solid ${sub.color}25` }}
          >
            <span className="text-2xl">{sub.icon}</span>
            <span className="font-mono text-[10px] text-[#A8C8E0] tracking-wider text-center leading-tight">{sub.label}</span>
          </div>
        ))}
      </div>

      {/* See all link */}
      <Link
        href={`/products?category=${deal.slug}`}
        className="flex items-center gap-1 text-[#00D4FF] font-mono text-[11px] tracking-wider mt-3 hover:gap-2 transition-all"
      >
        See all <ChevronRight size={11} />
      </Link>
    </motion.div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { data: bestsellers, isLoading } = useProducts({ sort: 'rating', limit: 8 })

  return (
    <div>

      {/* Hero Carousel */}
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

      {/* Amazon-style 4-column deal cards */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DEALS.map((deal, i) => (
            <DealCard key={deal.slug} deal={deal} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 py-10 border-t border-[rgba(0,212,255,0.1)]">
        <SectionHeader title="BESTSELLERS" subtitle="Our most loved products by audiophiles across India" />
        <ProductsGrid products={bestsellers?.data} isLoading={isLoading} />
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-gold px-10 py-3 text-base">
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </section>

    </div>
  )
}
