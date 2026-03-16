'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GitCompareArrows, X, ShoppingCart, ArrowLeft, Check, Minus } from 'lucide-react'
import { useCompareStore } from '@/store/compare.store'
import { useCartStore } from '@/store/cart.store'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { Stars } from '@/components/ui'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

/* ─── Helpers ──────────────────────────────────────────────────── */
function allSpecKeys(products: Product[]): string[] {
  const keys = new Set<string>()
  for (const p of products) {
    for (const k of Object.keys(p.specs ?? {})) keys.add(k)
  }
  return Array.from(keys).sort()
}

function specValue(product: Product, key: string) {
  return (product.specs ?? {})[key] ?? null
}

function CellDiff({ values, idx }: { values: (string | null)[]; idx: number }) {
  const val = values[idx]
  const others = values.filter((_, i) => i !== idx)
  const same = others.some((v) => v === val)
  return (
    <span className={val ? (same ? 'text-[#E8F4FD]' : 'text-[#00FF88] font-semibold') : 'text-[rgba(74,127,165,0.4)]'}>
      {val ?? '—'}
    </span>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ComparePage() {
  const { items, remove, clear } = useCompareStore()
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <GitCompareArrows size={48} className="text-[rgba(0,212,255,0.25)] mx-auto mb-6" />
        <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider mb-3">NOTHING TO COMPARE</h1>
        <p className="font-mono text-sm text-[#4A7FA5] mb-8">
          Select up to 3 products from the product listing or detail page.
        </p>
        <Link href="/products" className="btn-cyan px-6 py-2.5 font-heading tracking-widest">
          BROWSE PRODUCTS
        </Link>
      </div>
    )
  }

  const specKeys = allSpecKeys(items)
  const colCount = items.length

  function handleAddToCart(product: Product) {
    const variant = product.variants.find((v) => v.is_active && v.stock_qty > 0)
      ?? product.variants.find((v) => v.is_active)
    if (!variant) { toast.error('No available variant'); return }
    addItem(product, variant)
    toast.success(`${product.name} added to cart`)
  }

  const gridCols = colCount === 2 ? 'grid-cols-[200px_1fr_1fr]' : 'grid-cols-[200px_1fr_1fr_1fr]'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 font-mono text-xs text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mb-3"
          >
            <ArrowLeft size={13} /> BACK
          </button>
          <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2 flex items-center gap-3">
            <GitCompareArrows size={28} className="text-[#00D4FF]" />
            COMPARE
          </h1>
          <div className="h-0.5 w-12 bg-[#00D4FF]" />
        </div>
        <button
          onClick={clear}
          className="font-mono text-xs text-[#4A7FA5] hover:text-[#FF3366] transition-colors flex items-center gap-1.5"
        >
          <X size={13} /> CLEAR ALL
        </button>
      </div>

      <div className="hud-card overflow-x-auto">
        <table className="w-full min-w-[520px]">
          {/* ── Product headers ── */}
          <thead>
            <tr className="border-b border-[rgba(0,212,255,0.1)]">
              <th className="w-[180px] px-4 py-3 text-left font-mono text-xs text-[#4A7FA5] tracking-widest">
                PRODUCT
              </th>
              {items.map((p) => {
                const img = getPrimaryImage(p.images)
                return (
                  <th key={p.id} className="px-4 py-4 align-top">
                    <div className="flex flex-col items-center gap-3">
                      {/* Remove */}
                      <button
                        onClick={() => remove(p.id)}
                        className="self-end text-[#4A7FA5] hover:text-[#FF3366] transition-colors"
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                      {/* Image */}
                      <Link href={`/products/${p.slug}`} className="block relative w-28 h-20 rounded overflow-hidden bg-[#0D1B2A]">
                        {img ? (
                          <Image
                            src={cloudinaryUrl(img.url)}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="w-full h-full bg-[rgba(0,212,255,0.05)]" />
                        )}
                      </Link>
                      {/* Name */}
                      <Link href={`/products/${p.slug}`} className="font-heading text-sm text-[#E8F4FD] hover:text-[#00D4FF] transition-colors text-center leading-snug">
                        {p.name}
                      </Link>
                      {/* Stars */}
                      <Stars rating={p.rating} count={p.review_count} />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {/* ── Price row ── */}
            <tr className="border-b border-[rgba(0,212,255,0.06)] bg-[rgba(0,212,255,0.02)]">
              <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5] tracking-widest">PRICE</td>
              {items.map((p) => {
                const v = p.variants.find((v) => v.is_active) ?? p.variants[0]
                return (
                  <td key={p.id} className="px-4 py-3 text-center">
                    {p.on_sale && p.sale_price != null ? (
                      <div>
                        <span className="font-mono text-base text-[#FF3366] font-bold">{fmt(p.sale_price)}</span>
                        <span className="font-mono text-xs text-[#4A7FA5] line-through ml-1.5">{fmt(v?.price ?? 0)}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-base text-[#FFB700] font-bold">{fmt(v?.price ?? 0)}</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* ── Category ── */}
            <tr className="border-b border-[rgba(0,212,255,0.06)]">
              <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5] tracking-widest">CATEGORY</td>
              {items.map((p) => (
                <td key={p.id} className="px-4 py-3 text-center font-mono text-xs text-[#E8F4FD] capitalize">
                  {p.category.replace(/_/g, ' ')}
                </td>
              ))}
            </tr>

            {/* ── Availability ── */}
            <tr className="border-b border-[rgba(0,212,255,0.06)] bg-[rgba(0,212,255,0.02)]">
              <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5] tracking-widest">AVAILABILITY</td>
              {items.map((p) => {
                const inStock = p.variants.some((v) => v.is_active && v.stock_qty > 0)
                return (
                  <td key={p.id} className="px-4 py-3 text-center">
                    {inStock ? (
                      <span className="flex items-center justify-center gap-1 font-mono text-xs text-[#00FF88]">
                        <Check size={12} /> In Stock
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 font-mono text-xs text-[#FF3366]">
                        <Minus size={12} /> Out of Stock
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* ── Variants ── */}
            <tr className="border-b border-[rgba(0,212,255,0.06)]">
              <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5] tracking-widest">VARIANTS</td>
              {items.map((p) => (
                <td key={p.id} className="px-4 py-3 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {p.variants.filter((v) => v.is_active).map((v) => (
                      <span key={v.id} className="font-mono text-[10px] px-1.5 py-0.5 border border-[rgba(0,212,255,0.2)] text-[#4A7FA5] rounded">
                        {v.label}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* ── Specs ── */}
            {specKeys.length > 0 && (
              <tr>
                <td colSpan={colCount + 1} className="px-4 pt-5 pb-1">
                  <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest uppercase border-b border-[rgba(0,212,255,0.1)] pb-1">Specifications</p>
                </td>
              </tr>
            )}
            {specKeys.map((key, i) => {
              const values = items.map((p) => specValue(p, key))
              return (
                <tr
                  key={key}
                  className={`border-b border-[rgba(0,212,255,0.06)] ${i % 2 === 0 ? 'bg-[rgba(0,212,255,0.02)]' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-[#4A7FA5] tracking-widest capitalize">
                    {key.replace(/_/g, ' ')}
                  </td>
                  {items.map((p, pi) => (
                    <td key={p.id} className="px-4 py-2.5 text-center font-mono text-xs">
                      <CellDiff values={values} idx={pi} />
                    </td>
                  ))}
                </tr>
              )
            })}

            {/* ── Add to cart row ── */}
            <tr>
              <td className="px-4 py-5" />
              {items.map((p) => {
                const inStock = p.variants.some((v) => v.is_active && v.stock_qty > 0)
                return (
                  <td key={p.id} className="px-4 py-5 text-center">
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={!inStock}
                      className={`flex items-center justify-center gap-1.5 mx-auto px-4 py-2 rounded font-heading text-xs tracking-widest transition-all ${
                        inStock ? 'btn-cyan' : 'opacity-40 cursor-not-allowed border border-[rgba(0,212,255,0.2)] text-[#4A7FA5]'
                      }`}
                    >
                      <ShoppingCart size={13} />
                      {inStock ? 'ADD TO CART' : 'SOLD OUT'}
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tip */}
      <p className="font-mono text-[10px] text-[rgba(74,127,165,0.5)] mt-4 text-center">
        Spec values highlighted in green differ from the other products in the comparison.
      </p>
    </div>
  )
}
