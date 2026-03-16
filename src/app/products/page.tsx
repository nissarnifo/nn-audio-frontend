'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useProducts } from '@/hooks'
import ProductsGrid from '@/components/product/ProductsGrid'
import { Pagination } from '@/components/ui'
import type { ProductCategory } from '@/types'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'amplifier', label: 'Amplifiers' },
  { value: 'speaker', label: 'Speakers' },
  { value: 'speaker_box', label: 'Speaker Box' },
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

const RATINGS = [4, 3, 2, 1]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [sort, setSort] = useState('rating')
  const [page, setPage] = useState(1)
  // New filters
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStock, setInStock] = useState(false)
  const [minRating, setMinRating] = useState(0)

  const hasActiveFilters = minPrice !== '' || maxPrice !== '' || inStock || minRating > 0

  const { data, isLoading } = useProducts({
    search: search || undefined,
    category: (category || undefined) as ProductCategory | undefined,
    sort: sort as 'rating' | 'newest' | 'price_asc' | 'price_desc',
    page,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    in_stock: inStock || undefined,
    min_rating: minRating || undefined,
  })

  function resetPage() { setPage(1) }
  function handleSearch(val: string) { setSearch(val); resetPage() }
  function handleCategory(val: ProductCategory | '') { setCategory(val); resetPage() }
  function handleSort(val: string) { setSort(val); resetPage() }
  function handleMinPrice(val: string) { setMinPrice(val); resetPage() }
  function handleMaxPrice(val: string) { setMaxPrice(val); resetPage() }
  function handleInStock() { setInStock((v) => !v); resetPage() }
  function handleMinRating(r: number) { setMinRating((v) => (v === r ? 0 : r)); resetPage() }
  function clearFilters() { setMinPrice(''); setMaxPrice(''); setInStock(false); setMinRating(0); resetPage() }

  const pillBase = 'px-3 py-1.5 rounded font-mono text-xs border transition-all'
  const pillActive = 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
  const pillIdle = 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)] hover:text-[#E8F4FD]'

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">PRODUCTS</h1>
        <div className="h-0.5 w-12 bg-[#00D4FF]" />
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products..."
            className="input-hud pl-9"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="input-hud pl-9 pr-4 w-full sm:w-48"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className={`${pillBase} ${category === cat.value ? pillActive : pillIdle}`}
          >
            {cat.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Advanced filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-[rgba(0,212,255,0.1)]">
        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#4A7FA5]">PRICE</span>
          <input
            type="number"
            min={0}
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => handleMinPrice(e.target.value)}
            className="input-hud w-24 text-xs py-1.5"
          />
          <span className="text-[#4A7FA5] font-mono text-xs">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => handleMaxPrice(e.target.value)}
            className="input-hud w-24 text-xs py-1.5"
          />
        </div>

        {/* In Stock toggle */}
        <button
          onClick={handleInStock}
          className={`${pillBase} ${inStock ? 'border-[#00FF88] text-[#00FF88] bg-[rgba(0,255,136,0.08)]' : pillIdle}`}
        >
          IN STOCK
        </button>

        {/* Min rating buttons */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-[#4A7FA5] mr-1">RATING</span>
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => handleMinRating(r)}
              className={`${pillBase} ${minRating === r ? 'border-[#FFB700] text-[#FFB700] bg-[rgba(255,183,0,0.08)]' : pillIdle}`}
            >
              {r}★+
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 font-mono text-xs text-[#FF3366] border border-[rgba(255,51,102,0.3)] hover:border-[#FF3366] px-3 py-1.5 rounded transition-all"
          >
            <X size={12} /> CLEAR
          </button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && data && (
        <p className="text-[#4A7FA5] font-mono text-xs mb-6">
          {data.total} PRODUCT{data.total !== 1 ? 'S' : ''} FOUND
        </p>
      )}

      <ProductsGrid products={data?.data} isLoading={isLoading} />

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPage={setPage}
      />
    </div>
  )
}
