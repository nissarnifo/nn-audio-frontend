'use client'
import { useState } from 'react'
import type { Product } from '@/types'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'
import { PageLoading, EmptyState } from '@/components/ui'
import { Package } from 'lucide-react'

interface Props {
  products?: Product[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDesc?: string
  disableQuickView?: boolean
}

export default function ProductsGrid({
  products,
  isLoading,
  emptyTitle = 'No Products Found',
  emptyDesc = 'Try adjusting your filters or search terms.',
  disableQuickView = false,
}: Props) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  if (isLoading) return <PageLoading />

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={48} />}
        title={emptyTitle}
        description={emptyDesc}
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={disableQuickView ? undefined : setQuickViewProduct}
          />
        ))}
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  )
}
