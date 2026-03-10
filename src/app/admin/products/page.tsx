'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'
import { useProducts } from '@/hooks'
import { fmt, getPrimaryImage, cloudinaryUrl } from '@/lib/utils'
import { Badge, PageLoading, SectionHeader } from '@/components/ui'
import type { ProductCategory } from '@/types'

export default function AdminProductsPage() {
  const [category, setCategory] = useState<ProductCategory | undefined>()
  const { data, isLoading } = useProducts({ category, limit: 50 })

  if (isLoading) return <PageLoading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <SectionHeader title="PRODUCTS" subtitle="Manage your product catalog" />
        <Link href="/admin/products/new" className="btn-cyan flex items-center gap-1.5">
          <Plus size={15} /> NEW PRODUCT
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['', 'amplifier', 'speaker', 'subwoofer', 'processor', 'cable', 'accessory'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat || undefined)}
            className={`px-3 py-1 rounded font-mono text-xs border transition-all ${
              (cat === '' ? !category : category === cat)
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'
            }`}
          >
            {cat === '' ? 'ALL' : cat.toUpperCase()}
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
              </div>
              <div className="p-4">
                <p className="font-mono text-[10px] text-[#4A7FA5] mb-1">{product.sku}</p>
                <h3 className="font-heading text-sm text-[#E8F4FD] line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#FFB700]">
                    {fmt(product.variants[0]?.price ?? 0)}
                  </span>
                  <Link href={`/admin/products/${product.id}`} className="btn-cyan text-xs flex items-center gap-1">
                    <Edit size={12} /> EDIT
                  </Link>
                </div>
                {product.badge && (
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
