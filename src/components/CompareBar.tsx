'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { X, GitCompareArrows, Trash2 } from 'lucide-react'
import { useCompareStore } from '@/store/compare.store'
import { getPrimaryImage, cloudinaryUrl } from '@/lib/utils'

export default function CompareBar() {
  const { items, remove, clear } = useCompareStore()
  const router = useRouter()

  // Avoid hydration mismatch — render only client-side
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || items.length === 0) return null

  const slots = [0, 1, 2]

  return (
    <AnimatePresence>
      <motion.div
        key="compare-bar"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(0,212,255,0.2)] bg-[rgba(10,14,26,0.97)] backdrop-blur-md"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Label */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <GitCompareArrows size={16} className="text-[#00D4FF]" />
            <span className="font-heading text-xs text-[#00D4FF] tracking-widest">COMPARE</span>
            <span className="font-mono text-xs text-[#4A7FA5]">({items.length}/3)</span>
          </div>

          {/* Product slots */}
          <div className="flex-1 flex gap-3 overflow-x-auto">
            {slots.map((i) => {
              const product = items[i]
              if (!product) {
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[100px] max-w-[180px] h-12 rounded border border-dashed border-[rgba(0,212,255,0.2)] flex items-center justify-center"
                  >
                    <span className="font-mono text-[10px] text-[rgba(74,127,165,0.5)]">EMPTY SLOT</span>
                  </div>
                )
              }
              const img = getPrimaryImage(product.images)
              return (
                <div
                  key={product.id}
                  className="flex-1 min-w-[100px] max-w-[180px] h-12 rounded border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] flex items-center gap-2 px-2 group"
                >
                  <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 bg-[#0D1B2A]">
                    {img ? (
                      <Image
                        src={cloudinaryUrl(img.url)}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full bg-[rgba(0,212,255,0.1)]" />
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-[#E8F4FD] leading-tight line-clamp-2 flex-1 min-w-0">
                    {product.name}
                  </p>
                  <button
                    onClick={() => remove(product.id)}
                    className="shrink-0 text-[#4A7FA5] hover:text-[#FF3366] opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove from comparison"
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/compare')}
              disabled={items.length < 2}
              className={`btn-cyan px-3 py-2 font-heading text-xs tracking-widest flex items-center gap-1.5 ${
                items.length < 2 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <GitCompareArrows size={13} />
              COMPARE
            </button>
            <button
              onClick={clear}
              className="p-2 text-[#4A7FA5] hover:text-[#FF3366] transition-colors"
              aria-label="Clear comparison"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
