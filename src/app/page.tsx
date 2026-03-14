'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Shield, Truck, Star, ChevronRight, Award, Headphones, Settings2, Quote } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { SectionHeader } from '@/components/ui'
import { useState } from 'react'

/* ─── Data ──────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: 'Amplifiers',  slug: 'amplifier',  icon: '⚡', desc: 'High-power mono & 4-channel amps' },
  { label: 'Speakers',    slug: 'speaker',    icon: '🔊', desc: 'Component & coaxial speaker sets' },
  { label: 'Subwoofers',  slug: 'subwoofer',  icon: '🎵', desc: 'Deep bass, precision tuned' },
  { label: 'Processors',  slug: 'processor',  icon: '🎛️', desc: 'DSP & signal processors' },
]

const TRUST_BADGES = [
  { icon: <Zap size={24} />,    title: 'Premium Components', desc: 'Audiophile-grade parts in every build' },
  { icon: <Shield size={24} />, title: '2-Year Warranty',    desc: 'Comprehensive coverage, no questions' },
  { icon: <Truck size={24} />,  title: 'Pan-India Shipping', desc: 'Fast & insured delivery across India' },
  { icon: <Star size={24} />,   title: '4.8★ Rated',         desc: 'Loved by 10,000+ customers' },
]

const STATS = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '50+',     label: 'Products' },
  { value: '5+',      label: 'Years Experience' },
  { value: '2-Year',  label: 'Warranty' },
]

const MARQUEE_ITEMS = [
  '⚡ HIGH POWER AMPLIFIERS',
  '🔊 PREMIUM SPEAKERS',
  '🎵 DEEP BASS SUBWOOFERS',
  '🎛️ DSP PROCESSORS',
  '🏆 MADE IN INDIA',
  '🛡️ 2-YEAR WARRANTY',
  '🚚 PAN-INDIA SHIPPING',
  '⭐ 4.8 STAR RATED',
]

const WHY_NN = [
  {
    icon: <Award size={32} />,
    title: 'Audiophile Build Quality',
    desc: 'Every unit is hand-assembled using military-grade components, precision-tested for THD below 0.005% — because your ears deserve better.',
  },
  {
    icon: <Headphones size={32} />,
    title: 'Engineered for Sound',
    desc: 'Our in-house acoustic engineers tune each product across 20Hz–20kHz before it leaves the floor. Science-backed, passion-driven.',
  },
  {
    icon: <Settings2 size={32} />,
    title: 'Lifetime Support',
    desc: 'Dedicated tech support, firmware updates, and service centres across India. We stand behind every product we sell, always.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Rajan Mehta',
    location: 'Mumbai',
    rating: 5,
    text: 'The N&N 2000W mono-block is an absolute beast. Clean power, zero distortion even at full load. My subs have never hit this hard before.',
  },
  {
    name: 'Arjun Sharma',
    location: 'Delhi',
    rating: 5,
    text: "Bought the component speaker set and couldn't believe the imaging. Sounds like a live stage. Best audio investment I've ever made.",
  },
  {
    name: 'Priya Krishnan',
    location: 'Bangalore',
    rating: 5,
    text: 'Setup was easy, support team is responsive. The DSP processor completely transformed my car\'s stock system. 10/10 would recommend.',
  },
]

/* ─── fade-up variant (visible immediately, no threshold issue) ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
})

/* ─── Newsletter ─────────────────────────────────────────────────── */
function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <section className="relative overflow-hidden border-t border-[rgba(0,212,255,0.15)]">
      <div className="absolute inset-0 hud-grid opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/6 via-transparent to-[#FFB700]/6 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div {...fadeUp(0)}>
          <p className="font-mono text-[#00D4FF] text-xs tracking-[0.3em] mb-3">STAY IN THE LOOP</p>
          <h2 className="font-heading text-3xl md:text-4xl text-[#E8F4FD] tracking-wider mb-3">
            GET EARLY ACCESS &amp; DEALS
          </h2>
          <p className="text-[#A8C8E0] mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Be first to know about new launches, exclusive offers, and pro audio tips from the N&amp;N team.
          </p>
          {sent ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded border border-[#00FF88] text-[#00FF88] font-mono text-sm">
              ✓ YOU&apos;RE ON THE LIST — THANKS!
            </div>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); if (email) setSent(true) }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-hud flex-1 text-center sm:text-left"
              />
              <button type="submit" className="btn-gold px-6 py-2.5 text-sm whitespace-nowrap">
                SUBSCRIBE
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { data: bestsellers, isLoading } = useProducts({ sort: 'rating', limit: 8 })

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden hud-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/8 via-transparent to-[#0A0E1A] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/50 via-transparent to-[#0A0E1A]/50 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-28 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <p className="font-mono text-[#00D4FF] text-sm tracking-widest mb-4">
              ⚡ PRECISION AUDIO · MADE IN INDIA
            </p>
            <h1 className="font-heading leading-none tracking-wider mb-6 flex flex-wrap items-center">
              <span className="text-5xl md:text-7xl text-[#E8F4FD]">N&amp;N&nbsp;</span>
              <span className="text-5xl md:text-7xl text-[#00D4FF] animate-cyanglow">AUDIO SYSTEMS</span>
            </h1>
            <p className="text-[#A8C8E0] text-lg leading-relaxed mb-10 max-w-xl">
              N &amp; N Audio Systems crafts premium amplifiers, speakers and subwoofers
              for audiophiles who demand the absolute best.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Link href="/products" className="btn-gold text-base px-8 py-3">EXPLORE CATALOG</Link>
              <Link href="/products?category=amplifier" className="btn-cyan text-base px-8 py-3">SHOP AMPLIFIERS</Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-[rgba(0,212,255,0.2)]">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="font-heading text-3xl md:text-4xl text-[#00D4FF]">{s.value}</p>
                  <p className="font-mono text-[11px] text-[#7EB8D4] tracking-widest mt-1">{s.label.toUpperCase()}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee Ticker ────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] py-3">
        <div className="animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="font-mono text-[12px] tracking-[0.18em] text-[#A8C8E0] px-6 whitespace-nowrap">
              {item}
              <span className="ml-6 text-[#00D4FF] opacity-50">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Trust Badges ──────────────────────────────────────────── */}
      <section className="border-b border-[rgba(0,212,255,0.15)] bg-[rgba(13,27,42,0.8)]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="text-[#00D4FF] mt-0.5 flex-shrink-0">{b.icon}</div>
                <div>
                  <p className="font-heading text-sm text-[#E8F4FD] tracking-wide">{b.title}</p>
                  <p className="text-xs text-[#A8C8E0] mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionHeader title="SHOP BY CATEGORY" subtitle="Engineered for every stage of your audio chain" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.slug} {...fadeUp(i * 0.08)}>
              <Link href={`/products?category=${cat.slug}`} className="hud-card p-6 flex flex-col items-center text-center gap-3 block">
                <div className="text-4xl">{cat.icon}</div>
                <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider">{cat.label}</h3>
                <p className="text-xs text-[#A8C8E0]">{cat.desc}</p>
                <div className="flex items-center gap-1 text-[#00D4FF] text-xs font-mono mt-auto">
                  SHOP NOW <ChevronRight size={12} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why N&N ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 border-y border-[rgba(0,212,255,0.15)]"
        style={{ background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, rgba(13,27,42,0.9) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="WHY N&N AUDIO" subtitle="Three reasons audiophiles across India trust us" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_NN.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.15)}
                className="hud-card p-7"
                style={{ background: 'rgba(13,27,42,0.95)', borderColor: 'rgba(0,212,255,0.25)' }}
              >
                <div className="text-[#FFB700] mb-5">{item.icon}</div>
                <h3 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-3">{item.title}</h3>
                <p className="text-[#A8C8E0] text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bestsellers ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionHeader title="BESTSELLERS" subtitle="Our most loved products by audiophiles across India" />
        <ProductsGrid products={bestsellers?.data} isLoading={isLoading} />
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-gold px-10 py-3 text-base">VIEW ALL PRODUCTS</Link>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="border-t border-[rgba(0,212,255,0.15)] py-16"
        style={{ background: 'rgba(13,27,42,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="WHAT CUSTOMERS SAY" subtitle="Real reviews from real audiophiles" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp(i * 0.12)}
                className="hud-card p-6 flex flex-col gap-4"
                style={{ background: 'rgba(13,27,42,0.95)', borderColor: 'rgba(0,212,255,0.25)' }}
              >
                <Quote size={22} className="text-[#00D4FF] flex-shrink-0" />
                <p className="text-[#C8DFF0] text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,212,255,0.15)]">
                  <div>
                    <p className="font-heading text-sm text-[#E8F4FD] tracking-wide">{t.name}</p>
                    <p className="font-mono text-[10px] text-[#7EB8D4] tracking-widest">{t.location}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={13} className="text-[#FFB700] fill-[#FFB700]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <Newsletter />

    </div>
  )
}
