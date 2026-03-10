'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Upload, Trash2, Star } from 'lucide-react'
import type { ProductImage } from '@/types'
import { productsApi } from '@/services/api'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

interface Props {
  productId: string
  images: ProductImage[]
  onUpdate: () => void
}

export default function ImageUploader({ productId, images, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        const fd = new FormData()
        fd.append('image', file)
        await productsApi.uploadImage(productId, fd)
      }
      onUpdate()
      toast.success(`${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [productId, onUpdate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  })

  async function handleSetPrimary(imageId: string) {
    setLoadingId(imageId)
    try {
      await productsApi.setPrimaryImage(productId, imageId)
      onUpdate()
      toast.success('Primary image updated')
    } catch {
      toast.error('Failed to update primary image')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(imageId: string) {
    setLoadingId(imageId)
    try {
      await productsApi.deleteImage(productId, imageId)
      onUpdate()
      toast.success('Image removed')
    } catch {
      toast.error('Failed to remove image')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-[#4A7FA5]">
          {uploading ? (
            <>
              <Spinner />
              <p className="font-mono text-sm">UPLOADING...</p>
            </>
          ) : (
            <>
              <Upload size={28} />
              <p className="font-mono text-sm">
                {isDragActive ? 'DROP IMAGES HERE' : 'DRAG & DROP or CLICK TO UPLOAD'}
              </p>
              <p className="text-xs">PNG, JPG, WEBP supported — multiple files allowed</p>
            </>
          )}
        </div>
      </div>

      {/* Existing images */}
      {images.length > 0 && (
        <div>
          <p className="font-mono text-[10px] text-[#4A7FA5] mb-2 tracking-widest">
            {images.length} IMAGE{images.length !== 1 ? 'S' : ''} — HOVER TO MANAGE
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`relative group rounded overflow-hidden border transition-colors ${
                  img.is_primary
                    ? 'border-[#FFB700]'
                    : 'border-[rgba(0,212,255,0.15)]'
                }`}
              >
                <div className="relative aspect-square">
                  <Image src={img.url} alt="Product" fill className="object-cover" sizes="120px" />
                </div>

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute top-1 left-1 bg-[#FFB700] text-[#0A0E1A] text-[9px] font-mono px-1 rounded flex items-center gap-0.5">
                    <Star size={8} fill="currentColor" /> PRIMARY
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-[rgba(10,14,26,0.85)] flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {loadingId === img.id ? (
                    <Spinner size={18} />
                  ) : (
                    <>
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.id)}
                          title="Set as primary"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#FFB700] text-[#0A0E1A] font-mono text-[9px] hover:bg-[#ffc733] transition-colors"
                        >
                          <Star size={10} fill="currentColor" /> SET PRIMARY
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(img.id)}
                        title="Delete image"
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[rgba(255,51,102,0.2)] text-[#FF3366] border border-[rgba(255,51,102,0.4)] font-mono text-[9px] hover:bg-[rgba(255,51,102,0.4)] transition-colors"
                      >
                        <Trash2 size={10} /> DELETE
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
