'use client'
import { useState } from 'react'
import { Mail, Trash2, Download, Search, Users } from 'lucide-react'
import { useNewsletterSubscribers, useDeleteNewsletterSubscriber } from '@/hooks'
import { SectionHeader, Spinner } from '@/components/ui'
import { newsletterApi } from '@/services/api'
import { fmtDate } from '@/lib/utils'

const FILTERS = [
  { value: 'active',       label: 'Active' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'all',          label: 'All' },
]

export default function AdminNewsletterPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading } = useNewsletterSubscribers({ page, limit, search: search || undefined, filter })
  const { mutate: remove, isPending: isRemoving } = useDeleteNewsletterSubscriber()

  const subscribers = data?.subscribers ?? []
  const total  = data?.total ?? 0
  const pages  = data?.pages ?? 1

  function handleExport() {
    window.open(newsletterApi.getExportUrl(), '_blank')
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <SectionHeader title="NEWSLETTER" />
        <Mail size={18} className="text-[#4A7FA5]" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'ACTIVE', value: filter === 'active' ? total : '—', color: 'text-[#00FF88]' },
          { label: 'SHOWING', value: subscribers.length, color: 'text-[#00D4FF]' },
          { label: 'TOTAL PAGES', value: pages, color: 'text-[#FFB700]' },
        ].map((s) => (
          <div key={s.label} className="hud-card p-4 text-center">
            <p className={`font-heading text-2xl ${s.color}`}>{s.value}</p>
            <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
          <input
            className="input-hud w-full pl-8 text-sm"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1) }}
              className={`px-3 py-1.5 rounded border font-mono text-xs transition-all ${
                filter === f.value
                  ? 'border-[rgba(0,212,255,0.5)] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                  : 'border-[rgba(0,212,255,0.15)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.3)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 rounded border border-[rgba(0,255,136,0.25)] text-[#00FF88] font-mono text-xs hover:bg-[rgba(0,255,136,0.06)] transition-all"
        >
          <Download size={13} />
          EXPORT CSV
        </button>
      </div>

      {/* Table */}
      <div className="hud-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size={24} /></div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-[#4A7FA5]">
            <Users size={40} className="opacity-30" />
            <p className="font-mono text-sm">No subscribers found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="text-left px-5 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">EMAIL</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">SOURCE</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">SUBSCRIBED</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-[#4A7FA5] tracking-widest">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-[#E8F4FD]">{s.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5] capitalize">{s.source}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#4A7FA5]">{fmtDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      s.unsubscribed
                        ? 'border-[rgba(255,51,102,0.3)] text-[#FF3366] bg-[rgba(255,51,102,0.06)]'
                        : 'border-[rgba(0,255,136,0.3)] text-[#00FF88] bg-[rgba(0,255,136,0.06)]'
                    }`}>
                      {s.unsubscribed ? 'UNSUBSCRIBED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
                      disabled={isRemoving}
                      className="p-1.5 rounded border border-[rgba(255,51,102,0.2)] text-[rgba(255,51,102,0.5)] hover:border-[#FF3366] hover:text-[#FF3366] transition-all"
                      title="Delete subscriber"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] font-mono text-xs text-[#4A7FA5] disabled:opacity-40 hover:border-[rgba(0,212,255,0.4)] transition-all"
          >
            PREV
          </button>
          <span className="font-mono text-xs text-[#4A7FA5]">{page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] font-mono text-xs text-[#4A7FA5] disabled:opacity-40 hover:border-[rgba(0,212,255,0.4)] transition-all"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  )
}
