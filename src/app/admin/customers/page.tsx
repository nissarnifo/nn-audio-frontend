'use client'
import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminCustomers } from '@/hooks'
import { PageLoading, SectionHeader, Pagination } from '@/components/ui'
import { fmtDate } from '@/lib/utils'

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const router = useRouter()
  const { data, isLoading } = useAdminCustomers({ search: search || undefined, page })

  if (isLoading) return <PageLoading />

  const paged = data as { data?: unknown[]; total_pages?: number } | unknown[] | undefined
  const customers = Array.isArray(paged) ? paged : (paged as { data?: unknown[] })?.data ?? []
  const totalPages = Array.isArray(paged) ? 1 : ((paged as { total_pages?: number })?.total_pages ?? 1)

  function handleSearch(val: string) { setSearch(val); setPage(1) }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="CUSTOMERS" subtitle="All registered customers" />

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input-hud pl-9"
        />
      </div>

      <div className="hud-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.12)]">
                {['NAME', 'EMAIL', 'PHONE', 'ORDERS', 'JOINED', ''].map((h) => (
                  <th key={h} className="text-left p-4 font-mono text-[10px] text-[#4A7FA5] tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(customers as Array<{ id: string; name: string; email: string; phone: string; order_count?: number; created_at: string }>).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                  className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.03)] transition-colors cursor-pointer"
                >
                  <td className="p-4 text-sm text-[#E8F4FD] font-medium">{c.name}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{c.email}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{c.phone ?? '—'}</td>
                  <td className="p-4 font-mono text-sm text-[#00D4FF]">{c.order_count ?? 0}</td>
                  <td className="p-4 font-mono text-xs text-[#4A7FA5]">{fmtDate(c.created_at)}</td>
                  <td className="p-4 text-[#4A7FA5]"><ChevronRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-heading text-lg text-[#4A7FA5]">No customers found.</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}
