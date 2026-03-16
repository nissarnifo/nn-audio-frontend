'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Star, Trash2, ExternalLink } from 'lucide-react'
import { useAdminReviews, useDeleteAdminReview } from '@/hooks'
import { SectionHeader, Spinner, Pagination } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import type { AdminReview } from '@/services/api'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= rating ? 'fill-[#FFB700] text-[#FFB700]' : 'text-[rgba(255,183,0,0.2)]'}
        />
      ))}
    </div>
  )
}

const RATINGS = [1, 2, 3, 4, 5]

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState<number | undefined>()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminReviews({
    page,
    rating,
    search: search || undefined,
  })

  const { mutate: deleteReview, isPending: isDeleting } = useDeleteAdminReview()

  function handleSearch(val: string) { setSearch(val); setPage(1) }
  function handleRating(r: number) { setRating((v) => (v === r ? undefined : r)); setPage(1) }

  const reviews: AdminReview[] = data?.data ?? []

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <SectionHeader title="REVIEWS" subtitle={`${data?.total ?? 0} total reviews`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search product, customer, comment..."
            className="input-hud pl-9 text-sm w-full"
          />
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mr-1">STARS:</span>
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => handleRating(r)}
              className={`flex items-center gap-0.5 px-2.5 py-1 rounded border font-mono text-xs transition-all ${
                rating === r
                  ? 'border-[#FFB700] text-[#FFB700] bg-[rgba(255,183,0,0.08)]'
                  : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(255,183,0,0.4)]'
              }`}
            >
              {r} <Star size={10} className={rating === r ? 'fill-[#FFB700]' : ''} />
            </button>
          ))}
          {rating && (
            <button
              onClick={() => { setRating(undefined); setPage(1) }}
              className="font-mono text-[10px] text-[#FF3366] hover:text-[#FF6B6B] transition-colors ml-1"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={24} /></div>
      ) : reviews.length === 0 ? (
        <div className="hud-card p-12 text-center">
          <Star size={32} className="text-[rgba(255,183,0,0.2)] mx-auto mb-3" />
          <p className="font-mono text-xs text-[#4A7FA5]">NO REVIEWS FOUND</p>
        </div>
      ) : (
        <div className="hud-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.12)]">
                {['PRODUCT', 'CUSTOMER', 'RATING', 'COMMENT', 'DATE', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)] transition-colors"
                >
                  {/* Product */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <Link
                      href={`/products/${review.product.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 font-mono text-xs text-[#00D4FF] hover:text-[#E8F4FD] transition-colors truncate"
                    >
                      {review.product.name}
                      <ExternalLink size={10} className="shrink-0" />
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#E8F4FD] font-medium leading-tight">{review.user.name}</p>
                    <p className="font-mono text-[10px] text-[#4A7FA5] truncate max-w-[140px]">{review.user.email}</p>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StarRow rating={review.rating} />
                    <span className="font-mono text-[10px] text-[#4A7FA5] mt-0.5 block">{review.rating}/5</span>
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 max-w-[260px]">
                    {review.comment ? (
                      <p className="font-mono text-xs text-[#E8F4FD] line-clamp-2 leading-relaxed">
                        {review.comment}
                      </p>
                    ) : (
                      <span className="font-mono text-xs text-[rgba(74,127,165,0.4)]">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-[#4A7FA5]">{fmtDate(review.created_at)}</span>
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm('Delete this review? The product rating will be recalculated.')) {
                          deleteReview(review.id)
                        }
                      }}
                      disabled={isDeleting}
                      className="text-[#4A7FA5] hover:text-[#FF3366] transition-colors disabled:opacity-40"
                      aria-label="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPage={setPage} />
    </div>
  )
}
