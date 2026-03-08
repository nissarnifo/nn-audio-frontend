'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import type { ProductCategory } from '@/types'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'amplifier', label: 'Amplifiers' },
  { value: 'speaker', label: 'Speakers' },
  { value: 'subwoofer', label: 'Subwoofers' },
  { value: 'processor', label: 'Processors' },
  { value: 'cable', label: 'Cables' },
  { value: 'accessory', label: 'Accessories' },
]

const SORTS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [sort, setSort] = useState('rating')

  const { data, isLoading } = useProducts({
    search: search || undefined,
    category: (category || undefined) as ProductCategory | undefined,
    sort: sort as 'rating' | 'newest' | 'price_asc' | 'price_desc',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">PRODUCTS</h1>
        <div className="h-0.5 w-12 bg-[#00D4FF]" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-hud pl-9"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-hud pl-9 pr-4 w-full sm:w-48"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-1.5 rounded font-mono text-xs border transition-all ${
              category === cat.value
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)] hover:text-[#E8F4FD]'
            }`}
          >
            {cat.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && data && (
        <p className="text-[#4A7FA5] font-mono text-xs mb-6">
          {data.total} PRODUCT{data.total !== 1 ? 'S' : ''} FOUND
        </p>
      )}

      <ProductsGrid products={data?.data} isLoading={isLoading} />
    </div>
  )
}
