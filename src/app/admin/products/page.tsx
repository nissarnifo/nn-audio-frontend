'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Plus, Tag, X } from 'lucide-react'
import { useProducts, useSetProductSale } from '@/hooks'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { Badge, PageLoading, SectionHeader, Spinner } from '@/components/ui'
import type { Product, ProductCategory } from '@/types'

function SaleModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { mutate: setSale, isPending } = useSetProductSale()
  const [salePrice, setSalePrice] = useState(String(product.sale_price ?? ''))
  const [startAt, setStartAt] = useState(product.sale_start_at ? product.sale_start_at.slice(0, 16) : '')
  const [endAt, setEndAt] = useState(product.sale_end_at ? product.sale_end_at.slice(0, 16) : '')

  function handleSave() {
    setSale({
      id: product.id,
      sale_price: salePrice ? parseFloat(salePrice) : null,
      sale_start_at: startAt ? new Date(startAt).toISOString() : null,
      sale_end_at: endAt ? new Date(endAt).toISOString() : null,
    }, { onSuccess: onClose })
  }

  function handleClear() {
    setSale({ id: product.id, sale_price: null, sale_start_at: null, sale_end_at: null }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,22,0.85)]" onClick={onClose}>
      <div className="hud-card p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-sm text-[#E8F4FD] tracking-widest">FLASH SALE — {product.name}</h3>
          <button onClick={onClose}><X size={16} className="text-[#4A7FA5] hover:text-[#E8F4FD]" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-[#4A7FA5] block mb-1">SALE PRICE (₹)</label>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder={`Current: ${fmt(product.variants[0]?.price ?? 0)}`}
              className="w-full bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-[#00D4FF]"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-[#4A7FA5] block mb-1">START DATE (optional)</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-[#00D4FF]"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-[#4A7FA5] block mb-1">END DATE (optional)</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-[#00D4FF]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {product.sale_price != null && (
            <button
              onClick={handleClear}
              disabled={isPending}
              className="flex-1 font-mono text-xs text-[#FF3366] border border-[rgba(255,51,102,0.4)] hover:bg-[rgba(255,51,102,0.08)] py-2.5 rounded transition-colors"
            >
              CLEAR SALE
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isPending || !salePrice}
            className="flex-1 btn-cyan flex items-center justify-center gap-2"
          >
            {isPending ? <><Spinner size={13} /> SAVING...</> : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  const [category, setCategory] = useState<ProductCategory | undefined>()
  const [saleTarget, setSaleTarget] = useState<Product | null>(null)
  const { data, isLoading } = useProducts({ category, limit: 50 })

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {saleTarget && <SaleModal product={saleTarget} onClose={() => setSaleTarget(null)} />}

      <div className="flex items-center justify-between mb-8">
        <SectionHeader title="PRODUCTS" subtitle="Manage your product catalog" />
        <Link
          href={`/admin/products/new${category ? `?category=${category}` : ''}`}
          className="btn-cyan flex items-center gap-1.5">
          <Plus size={15} /> NEW PRODUCT
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['', 'amplifier', 'speaker', 'speaker_box', 'subwoofer', 'processor', 'cable', 'accessory'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat || undefined)}
            className={`px-3 py-1 rounded font-mono text-xs border transition-all ${
              (cat === '' ? !category : category === cat)
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'
            }`}
          >
            {cat === '' ? 'ALL' : cat === 'speaker_box' ? 'SPEAKER BOX' : cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.data.map((product) => {
          const img = getPrimaryImage(product.images)
          return (
            <div key={product.id} className="hud-card overflow-hidden">
              <div className="relative aspect-video bg-[#0D1B2A]">
                {img ? (
                  <Image src={cloudinaryUrl(img.url, 400)} alt={product.name} fill className="object-cover" sizes="300px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4A7FA5] font-mono text-xs">NO IMAGE</div>
                )}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${product.is_active ? 'bg-[#00FF88]' : 'bg-[#FF3366]'}`} title={product.is_active ? 'Active' : 'Inactive'} />
                {product.on_sale && (
                  <div className="absolute top-2 left-2">
                    <Badge color="red">SALE</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-mono text-[10px] text-[#4A7FA5] mb-1">{product.sku}</p>
                <h3 className="font-heading text-sm text-[#E8F4FD] line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.on_sale && product.sale_price != null ? (
                      <>
                        <span className="font-mono text-sm text-[#FF3366] font-bold">{fmt(product.sale_price)}</span>
                        <span className="font-mono text-xs text-[#4A7FA5] line-through ml-1.5">{fmt(product.variants[0]?.price ?? 0)}</span>
                      </>
                    ) : (
                      <span className="font-mono text-sm text-[#FFB700]">{fmt(product.variants[0]?.price ?? 0)}</span>
                    )}
                  </div>
                  <Link href={`/admin/products/${product.id}`} className="btn-cyan text-xs flex items-center gap-1">
                    <Edit size={12} /> EDIT
                  </Link>
                </div>
                <button
                  onClick={() => setSaleTarget(product)}
                  className={`w-full flex items-center justify-center gap-1.5 font-mono text-xs py-1.5 rounded border transition-all ${
                    product.on_sale
                      ? 'border-[rgba(255,51,102,0.4)] text-[#FF3366] hover:bg-[rgba(255,51,102,0.06)]'
                      : 'border-[rgba(255,183,0,0.3)] text-[#FFB700] hover:bg-[rgba(255,183,0,0.06)]'
                  }`}
                >
                  <Tag size={11} />
                  {product.on_sale ? 'EDIT SALE' : 'SET SALE'}
                </button>
                {product.badge && !product.on_sale && (
                  <div className="mt-2">
                    <Badge color="gold">{product.badge}</Badge>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!data?.data.length && (
        <div className="text-center py-20">
          <p className="font-heading text-xl text-[#4A7FA5]">No products found.</p>
        </div>
      )}
    </div>
  )
}
