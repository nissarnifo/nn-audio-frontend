'use client'
import type { Product } from '@/types'
import ProductCard from './ProductCard'
import { PageLoading, EmptyState } from '@/components/ui'
import { Package, WifiOff } from 'lucide-react'

interface Props {
  products?: Product[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  emptyTitle?: string
  emptyDesc?: string
}

export default function ProductsGrid({
  products,
  isLoading,
  isError,
  onRetry,
  emptyTitle = 'No Products Found',
  emptyDesc = 'Try adjusting your filters or search terms.',
}: Props) {
  if (isLoading) return <PageLoading />

  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <WifiOff size={40} className="mx-auto text-[#4A7FA5]" />
        <p className="text-[#4A7FA5] font-mono text-sm">
          Could not connect to server — server may be starting up
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-cyan px-6 py-2 text-sm"
          >
            RETRY
          </button>
        )}
      </div>
    )
  }

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
