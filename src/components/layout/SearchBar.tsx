'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { productsApi } from '@/services/api'
import { getPrimaryImage, cloudinaryUrl, fmt } from '@/lib/utils'
import type { Product } from '@/types'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const CATEGORY_LABELS: Record<string, string> = {
  amplifier: 'Amplifier', speaker: 'Speaker', speaker_box: 'Speaker Box',
  subwoofer: 'Subwoofer', processor: 'Processor', cable: 'Cable', accessory: 'Accessory',
}

interface Props {
  onClose?: () => void
}

export default function SearchBar({ onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query.trim(), 300)

  // Focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    productsApi
      .getAll({ search: debouncedQuery, limit: 6 })
      .then((r) => {
        setResults(r.data.data ?? [])
        setOpen(true)
        setActiveIdx(-1)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    onClose?.()
    router.push(`/products?search=${encodeURIComponent(query.trim())}`)
  }

  function handleSelect(slug: string) {
    setOpen(false)
    setQuery('')
    onClose?.()
    router.push(`/products/${slug}`)
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(results[activeIdx].slug)
    } else if (e.key === 'Escape') {
      setOpen(false)
      onClose?.()
    }
  }, [open, results, activeIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const listboxId = 'search-listbox'
  const getOptionId = (i: number) => `search-option-${i}`

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2" role="search">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] pointer-events-none" aria-hidden="true" />
          {loading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] animate-spin" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search products"
            aria-expanded={open && results.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={activeIdx >= 0 ? getOptionId(activeIdx) : undefined}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search products..."
            className="input-hud w-full pl-9 pr-9 text-sm"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A7FA5] hover:text-[#E8F4FD] transition-colors"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-cyan px-4 py-2 text-xs font-heading tracking-widest whitespace-nowrap">
          SEARCH
        </button>
      </form>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded border border-[rgba(0,212,255,0.2)] bg-[#0D1B2A] shadow-2xl overflow-hidden"
        >
          {results.map((product, i) => {
            const img = getPrimaryImage(product.images)
            const variant = product.variants.find((v) => v.is_active) ?? product.variants[0]
            const isActive = i === activeIdx
            return (
              <button
                key={product.id}
                id={getOptionId(i)}
                role="option"
                aria-selected={isActive}
                onMouseDown={() => handleSelect(product.slug)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-[rgba(0,212,255,0.08)]' : 'hover:bg-[rgba(0,212,255,0.05)]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
                  {img ? (
                    <Image
                      src={cloudinaryUrl(img.url, 80)}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search size={14} className="text-[#4A7FA5]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm text-[#E8F4FD] truncate leading-tight">{product.name}</p>
                  <p className="font-mono text-[10px] text-[#4A7FA5] mt-0.5">
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </p>
                </div>

                {/* Price */}
                {variant && (
                  <span className="font-mono text-xs text-[#FFB700] flex-shrink-0">
                    {fmt(variant.price)}
                  </span>
                )}
              </button>
            )
          })}

          {/* "See all results" footer */}
          <div className="border-t border-[rgba(0,212,255,0.1)]">
            <Link
              href={`/products?search=${encodeURIComponent(query.trim())}`}
              onMouseDown={() => { setOpen(false); onClose?.() }}
              className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs text-[#00D4FF] hover:bg-[rgba(0,212,255,0.06)] transition-colors"
            >
              <Search size={12} aria-hidden="true" />
              SEE ALL RESULTS FOR &ldquo;{query.trim()}&rdquo;
            </Link>
          </div>
        </div>
      )}

      {/* No results */}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded border border-[rgba(0,212,255,0.2)] bg-[#0D1B2A] shadow-2xl px-4 py-3 text-center">
          <p className="font-mono text-xs text-[#4A7FA5]">No products found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
