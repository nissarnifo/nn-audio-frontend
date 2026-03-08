'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useProductById, useUpdateProduct } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import ProductForm from '@/components/admin/ProductForm'
import ImageUploader from '@/components/admin/ImageUploader'
import { PageLoading, SectionHeader } from '@/components/ui'
import { productsApi } from '@/services/api'
import { useQueryClient } from '@tanstack/react-query'
import type { Product } from '@/types'

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const isNew = id === 'new'

  const { data: product, isLoading } = useProductById(isNew ? '' : id)
  const { mutateAsync: updateProduct, isPending } = useUpdateProduct()

  useEffect(() => {
    if (!isAdmin) router.push('/auth/login')
  }, [isAdmin, router])

  if (!isNew && isLoading) return <PageLoading />

  async function handleSave(data: Partial<Product>) {
    if (isNew) {
      await productsApi.create(data)
      router.push('/admin/products')
    } else {
      await updateProduct({ id, data: data as Record<string, unknown> })
    }
  }

  function refreshProduct() {
    qc.invalidateQueries({ queryKey: ['product-id', id] })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors mb-6 font-mono text-sm">
        <ChevronLeft size={16} /> PRODUCTS
      </button>

      <SectionHeader
        title={isNew ? 'NEW PRODUCT' : 'EDIT PRODUCT'}
        subtitle={isNew ? 'Add a new product to the catalog' : product?.name}
      />

      <ProductForm initial={product} onSubmit={handleSave} loading={isPending} />

      {!isNew && product && (
        <div className="mt-8 hud-card p-6">
          <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wider mb-4">PRODUCT PHOTOS</h3>
          <ImageUploader
            productId={id}
            images={product.images}
            onUpdate={refreshProduct}
          />
        </div>
      )}
    </div>
  )
}
