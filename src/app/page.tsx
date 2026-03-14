'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Shield, Truck, Star, ChevronRight, Activity, Cpu, Radio, Wifi } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { SectionHeader } from '@/components/ui'
import { useEffect, useState } from 'react'

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

const SPECS = [
  { label: 'POWER OUTPUT', value: '2000W', unit: 'RMS', bar: 92 },
  { label: 'FREQ RESPONSE', value: '20Hz–20kHz', unit: 'FLAT', bar: 100 },
  { label: 'THD+N', value: '0.005', unit: '%', bar: 15 },
  { label: 'S/N RATIO', value: '112', unit: 'dB', bar: 88 },
]

const STATUS_NODES = [
  { icon: <Cpu size={11} />, label: 'DSP CORE', status: 'ACTIVE' },
  { icon: <Radio size={11} />, label: 'SIGNAL PATH', status: 'LOCKED' },
  { icon: <Wifi size={11} />, label: 'BT 5.2', status: 'READY' },
  { icon: <Activity size={11} />, label: 'THERMAL', status: 'NOMINAL' },
]

function JarvisPanel() {
  const [tick, setTick] = useState(0)
  const [scanY, setScanY] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let raf: number
    let y = 0
    const animate = () => {
      y = (y + 0.4) % 100
      setScanY(y)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const wavePoints = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 200
    const y = 28 + Math.sin((i / 39) * Math.PI * 6 + tick * 0.5) * 12 + Math.sin((i / 39) * Math.PI * 13 + tick * 0.8) * 5
    return `${x},${y}`
  }).join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.2 }}
      className="relative w-full max-w-[340px] select-none"
      style={{ fontFamily: 'monospace' }}
    >
      {/* outer glow border */}
      <div className="relative rounded-sm overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.04) 0%, rgba(0,212,255,0.01) 100%)',
          border: '1px solid rgba(0,212,255,0.25)',
          boxShadow: '0 0 40px rgba(0,212,255,0.08), inset 0 0 40px rgba(0,212,255,0.03)',
        }}
      >
        {/* scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            top: `${scanY}%`,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.18), rgba(0,212,255,0.35), rgba(0,212,255,0.18), transparent)',
          }} />
        </div>

        {/* HUD corner brackets */}
        {[['top-0 left-0', 'border-t border-l'], ['top-0 right-0', 'border-t border-r'],
          ['bottom-0 left-0', 'border-b border-l'], ['bottom-0 right-0', 'border-b border-r']].map(([pos, border]) => (
          <div key={pos} className={`absolute ${pos} w-4 h-4 ${border}`}
            style={{ borderColor: '#00D4FF', zIndex: 2 }} />
        ))}

        <div className="relative z-10 p-5 space-y-4">

          {/* header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] tracking-[0.3em] text-[#00D4FF] opacity-70">SYS.MODULE</p>
              <p className="text-[11px] tracking-[0.2em] text-[#E8F4FD] font-bold">AUDIO·CORE·v4.2</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#00D4FF] tracking-widest opacity-70">ONLINE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            </div>
          </div>

          {/* divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.5), rgba(0,212,255,0.05))' }} />

          {/* waveform */}
          <div className="relative" style={{ height: '56px', background: 'rgba(0,212,255,0.03)', borderRadius: 2 }}>
            <p className="absolute top-1 left-2 text-[8px] text-[#00D4FF] opacity-50 tracking-widest">FREQ.ANALYSIS</p>
            <svg viewBox="0 0 200 56" className="w-full h-full">
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={wavePoints} fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <polyline points={`0,56 ${wavePoints} 200,56`} fill="url(#wg)" stroke="none" opacity="0.25" />
            </svg>
          </div>

          {/* spec bars */}
          <div className="space-y-2.5">
            {SPECS.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[9px] tracking-[0.18em] text-[#4A7FA5]">{s.label}</span>
                  <span className="text-[10px] text-[#00D4FF] font-bold tracking-wider">
                    {s.value}&nbsp;<span className="text-[8px] opacity-60">{s.unit}</span>
                  </span>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: 'rgba(0,212,255,0.1)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${s.bar}%` }}
                    transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
                    style={{ background: 'linear-gradient(90deg, #00D4FF, #0099cc)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.05), rgba(0,212,255,0.4), rgba(0,212,255,0.05))' }} />

          {/* status nodes */}
          <div className="grid grid-cols-2 gap-2">
            {STATUS_NODES.map((n) => (
              <div key={n.label} className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm"
                style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <span className="text-[#00D4FF] opacity-70">{n.icon}</span>
                <div>
                  <p className="text-[8px] text-[#4A7FA5] leading-none">{n.label}</p>
                  <p className="text-[9px] text-[#00D4FF] leading-none mt-0.5 font-bold">{n.status}</p>
                </div>
              </div>
            ))}
          </div>

          {/* bottom id line */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] text-[#4A7FA5] tracking-widest opacity-60">ID::NN-AMP-PRO-X9</span>
            <span className="text-[8px] text-[#00D4FF] opacity-50 tracking-widest">{String(tick).padStart(4, '0')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const { data: bestsellers, isLoading } = useProducts({ sort: 'rating', limit: 8 })

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-24 w-full">
          <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">

            {/* LEFT — Jarvis HUD Panel */}
            <div className="flex-shrink-0 flex justify-center md:justify-start w-full md:w-auto">
              <JarvisPanel />
            </div>

            {/* RIGHT — Hero Copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 min-w-0"
            >
              <p className="font-mono text-[#00D4FF] text-sm tracking-widest mb-4">
                ⚡ PRECISION AUDIO · MADE IN INDIA
              </p>
              <h1 className="font-heading leading-none tracking-wider mb-6 flex flex-wrap items-center gap-0">
                <span className="text-4xl md:text-6xl text-[#E8F4FD]">
                  N&amp;N&nbsp;
                </span>
                <span className="text-4xl md:text-6xl text-[#00D4FF] animate-cyanglow">
                  AUDIO SYSTEMS
                </span>
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
