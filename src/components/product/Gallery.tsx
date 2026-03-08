'use client'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProductImage } from '@/types'
import { cloudinaryUrl } from '@/lib/utils'
import { NoPhoto } from '@/components/ui'

export default function Gallery({ images }: { images: ProductImage[] }) {
  const sorted = [...(images ?? [])].sort((a, b) => a.order - b.order)
  const [current, setCurrent] = useState(0)

  if (sorted.length === 0) return <NoPhoto className="w-full aspect-square rounded-lg" />

  const prev = () => setCurrent((c) => (c === 0 ? sorted.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === sorted.length - 1 ? 0 : c + 1))

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden hud-card">
        <Image
          src={cloudinaryUrl(sorted[current].url, 1200)}
          alt={`Product image ${current + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgba(10,14,26,0.8)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-[#00D4FF] hover:bg-[rgba(0,212,255,0.1)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgba(10,14,26,0.8)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-[#00D4FF] hover:bg-[rgba(0,212,255,0.1)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
        {/* Counter */}
        <div className="absolute bottom-2 right-2 font-mono text-xs text-[#4A7FA5] bg-[rgba(10,14,26,0.8)] px-2 py-0.5 rounded">
          {current + 1} / {sorted.length}
        </div>
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                i === current ? 'border-[#00D4FF]' : 'border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.4)]'
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={cloudinaryUrl(img.url, 200)}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
