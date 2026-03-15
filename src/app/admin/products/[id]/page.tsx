'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useProductById, useUpdateProduct } from '@/hooks'
import ProductForm from '@/components/admin/ProductForm'
import ImageUploader from '@/components/admin/ImageUploader'
import { PageLoading, SectionHeader } from '@/components/ui'
import { productsApi } from '@/services/api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const isNew = id === 'new'

  // Pre-select category when coming from filtered list (e.g. ?category=speaker_box)
  const presetCategory = searchParams.get('category') as Product['category'] | null

  const { data: product, isLoading } = useProductById(isNew ? '' : id)
  const { mutateAsync: updateProduct, isPending } = useUpdateProduct()

  if (!isNew && isLoading) return <PageLoading />

  async function handleSave(data: Partial<Product>) {
    if (isNew) {
      try {
        await productsApi.create(data)
        qc.invalidateQueries({ queryKey: ['products'] })
        toast.success('Product created successfully')
        router.push('/admin/products')
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? 'Failed to create product'
        toast.error(msg)
      }
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

      <ProductForm
        initial={isNew && presetCategory ? { category: presetCategory } : product}
        onSubmit={handleSave}
        loading={isPending}
      />

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
