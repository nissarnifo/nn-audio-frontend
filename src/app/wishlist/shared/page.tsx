'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { productsApi } from '@/services/api'
import ProductsGrid from '@/components/product/ProductsGrid'
import { Spinner } from '@/components/ui'
import type { Product } from '@/types'

function SharedWishlistInner() {
  const params = useSearchParams()
  const encoded = params.get('ids') ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!encoded) { setLoading(false); setError(true); return }
    let ids: string[]
    try {
      ids = atob(decodeURIComponent(encoded)).split(',').filter(Boolean)
    } catch {
      setLoading(false); setError(true); return
    }
    if (ids.length === 0) { setLoading(false); setError(true); return }

    productsApi
      .getByIds(ids)
      .then((r) => setProducts(r.data.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [encoded])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size={28} />
      </div>
    )
  }

  if (error || products.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Heart size={48} className="text-[rgba(255,51,102,0.25)] mx-auto mb-6" />
        <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider mb-3">WISHLIST NOT FOUND</h1>
        <p className="font-mono text-sm text-[#4A7FA5] mb-8">
          This wishlist link is invalid or the products are no longer available.
        </p>
        <Link href="/products" className="btn-cyan px-6 py-2.5 font-heading tracking-widest">
          BROWSE PRODUCTS
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart size={24} className="text-[#FF3366]" />
          <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider">SHARED WISHLIST</h1>
        </div>
        <div className="h-0.5 w-12 bg-[#FF3366] mb-3" />
        <p className="font-mono text-sm text-[#4A7FA5]">
          {products.length} item{products.length !== 1 ? 's' : ''} · Shared by a fellow audiophile
        </p>
      </div>
      <ProductsGrid products={products} />
      <div className="mt-10 text-center">
        <Link href="/products" className="inline-flex items-center gap-2 btn-gold px-8 py-3 font-heading tracking-widest">
          <ShoppingBag size={16} />
          EXPLORE MORE PRODUCTS
        </Link>
      </div>
    </div>
  )
}

export default function SharedWishlistPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Spinner size={28} /></div>}>
      <SharedWishlistInner />
    </Suspense>
  )
}
