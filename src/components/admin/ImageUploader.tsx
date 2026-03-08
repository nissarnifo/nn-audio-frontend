'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Upload, Trash2 } from 'lucide-react'
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        const fd = new FormData()
        fd.append('image', file)
        await productsApi.uploadImage(productId, fd)
      }
      onUpdate()
      toast.success('Images uploaded')
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

  async function handleDelete(imageId: string) {
    try {
      await productsApi.deleteImage(productId, imageId)
      onUpdate()
      toast.success('Image removed')
    } catch {
      toast.error('Failed to remove image')
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
            <Spinner />
          ) : (
            <>
              <Upload size={28} />
              <p className="font-mono text-sm">
                {isDragActive ? 'DROP IMAGES HERE' : 'DRAG & DROP or CLICK TO UPLOAD'}
              </p>
              <p className="text-xs">PNG, JPG, WEBP supported</p>
            </>
          )}
        </div>
      </div>

      {/* Existing images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded overflow-hidden border border-[rgba(0,212,255,0.15)]">
              <div className="relative aspect-square">
                <Image src={img.url} alt="Product" fill className="object-cover" sizes="100px" />
              </div>
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-[#FFB700] text-[#0A0E1A] text-[9px] font-mono px-1 rounded">
                  PRIMARY
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute inset-0 bg-[rgba(255,51,102,0.7)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
