'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Shield, Truck, Star, ChevronRight } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { SectionHeader } from '@/components/ui'

const CATEGORIES = [
  { label: 'Amplifiers', slug: 'amplifier', icon: '⚡', desc: 'High-power mono & 4-channel amps' },
  { label: 'Speakers', slug: 'speaker', icon: '🔊', desc: 'Component & coaxial speaker sets' },
  { label: 'Subwoofers', slug: 'subwoofer', icon: '🎵', desc: 'Deep bass, precision tuned' },
  { label: 'Processors', slug: 'processor', icon: '🎛️', desc: 'DSP & signal processors' },
]

const TRUST_BADGES = [
  { icon: <Zap size={24} />, title: 'Premium Components', desc: 'Audiophile-grade parts in every build' },
  { icon: <Shield size={24} />, title: '2-Year Warranty', desc: 'Comprehensive coverage, no questions' },
  { icon: <Truck size={24} />, title: 'Pan-India Shipping', desc: 'Fast & insured delivery across India' },
  { icon: <Star size={24} />, title: '4.8★ Rated', desc: 'Loved by 10,000+ customers' },
]

export default function HomePage() {
  const { data: bestsellers, isLoading } = useProducts({ sort: 'rating', limit: 8 })

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <p className="font-mono text-[#00D4FF] text-sm tracking-widest mb-4">
              ⚡ PRECISION AUDIO · MADE IN INDIA
            </p>
            <h1 className="font-heading leading-none tracking-wider mb-6 whitespace-nowrap flex items-center gap-0">
              <span className="text-4xl md:text-6xl text-[#E8F4FD]">
                N&amp;N&nbsp;
              </span>
              <span className="text-4xl md:text-6xl text-[#00D4FF] animate-cyanglow">
                AUDIO SYSTEMS
              </span>
              {/* Stark-style slash + underbar */}
              <svg className="ml-2 inline-block" style={{verticalAlign:'middle'}} width="44" height="50" viewBox="0 0 44 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <line x1="2" y1="48" x2="32" y2="2" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="square"/>
                <line x1="2" y1="48" x2="42" y2="48" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="square"/>
              </svg>
            </h1>
            <p className="text-[#4A7FA5] text-lg leading-relaxed mb-8 max-w-xl">
              N &amp; N Audio Systems crafts premium amplifiers, speakers and subwoofers
              for audiophiles who demand the absolute best.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-gold text-base px-8 py-3">
                EXPLORE CATALOG
              </Link>
              <Link href="/products?category=amplifier" className="btn-cyan text-base px-8 py-3">
                SHOP AMPLIFIERS
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-[rgba(0,212,255,0.1)] bg-[rgba(13,27,42,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="text-[#00D4FF] mt-0.5 flex-shrink-0">{b.icon}</div>
                <div>
                  <p className="font-heading text-sm text-[#E8F4FD] tracking-wide">{b.title}</p>
                  <p className="text-xs text-[#4A7FA5] mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionHeader title="SHOP BY CATEGORY" subtitle="Engineered for every stage of your audio chain" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/products?category=${cat.slug}`} className="hud-card p-6 flex flex-col items-center text-center gap-3 block">
                <div className="text-4xl">{cat.icon}</div>
                <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider">{cat.label}</h3>
                <p className="text-xs text-[#4A7FA5]">{cat.desc}</p>
                <div className="flex items-center gap-1 text-[#00D4FF] text-xs font-mono mt-auto">
                  SHOP NOW <ChevronRight size={12} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
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
