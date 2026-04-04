'use client'
import { useState } from 'react'
import { RotateCcw, ChevronDown } from 'lucide-react'
import { useAdminReturns, useUpdateReturnStatus } from '@/hooks'
import { SectionHeader, Spinner, EmptyState } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import type { ReturnRequest, ReturnStatus } from '@/types'

const STATUS_COLOR: Record<ReturnStatus, string> = {
  REQUESTED: '#FFB700',
  APPROVED: '#00D4FF',
  REJECTED: '#FF3366',
  REFUNDED: '#00FF88',
}

const STATUS_FILTERS = ['ALL', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'] as const

function ActionMenu({ ret }: { ret: ReturnRequest }) {
  const { mutate: update, isPending } = useUpdateReturnStatus()
  const [open, setOpen] = useState(false)
  const [adminNote, setAdminNote] = useState(ret.admin_note ?? '')

  const actions: { label: string; status: string; color: string }[] = []
  if (ret.status === 'REQUESTED') {
    actions.push(
      { label: 'Approve', status: 'APPROVED', color: '#00D4FF' },
      { label: 'Reject', status: 'REJECTED', color: '#FF3366' },
    )
  }
  if (ret.status === 'APPROVED') {
    actions.push({ label: 'Mark Refunded', status: 'REFUNDED', color: '#00FF88' })
  }

  if (actions.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 font-mono text-xs text-[#4A7FA5] border border-[rgba(0,212,255,0.2)] hover:border-[#00D4FF] hover:text-[#00D4FF] px-3 py-1.5 rounded transition-all"
      >
        ACTIONS <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-[#0D1B2A] border border-[rgba(0,212,255,0.2)] rounded shadow-xl min-w-[220px] p-3">
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Admin note (optional)"
            className="w-full bg-[#080C16] border border-[rgba(0,212,255,0.15)] text-[#E8F4FD] font-mono text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#00D4FF] resize-none mb-2"
          />
          {actions.map(({ label, status, color }) => (
            <button
              key={status}
              disabled={isPending}
              onClick={() => {
                update({ id: ret.id, status, admin_note: adminNote || undefined })
                setOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 font-mono text-xs py-2 rounded border mb-1 hover:opacity-90 transition-opacity"
              style={{ color, borderColor: `${color}40`, background: `${color}10` }}
            >
              {isPending ? <Spinner size={12} /> : label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="w-full font-mono text-xs text-[#4A7FA5] py-1 mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminReturnsPage() {
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminReturns({
    page,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <SectionHeader title="RETURNS" subtitle="Manage customer return requests" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`font-mono text-xs px-4 py-2 rounded border transition-all ${
              statusFilter === s
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.15)] text-[#4A7FA5] hover:border-[#00D4FF] hover:text-[#00D4FF]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={<RotateCcw size={56} />}
          title="No Return Requests"
          description="Return requests will appear here."
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((ret) => (
              <div key={ret.id} className="hud-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-mono text-[#00D4FF] text-sm">{ret.order_number}</span>
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                        style={{ color: STATUS_COLOR[ret.status], borderColor: `${STATUS_COLOR[ret.status]}40`, background: `${STATUS_COLOR[ret.status]}10` }}
                      >
                        {ret.status}
                      </span>
                      <span className="font-mono text-xs text-[#4A7FA5]">{fmtDate(ret.created_at)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs font-mono">
                      <div>
                        <p className="text-[#4A7FA5] text-[10px] mb-0.5">CUSTOMER</p>
                        <p className="text-[#E8F4FD]">{ret.user?.name}</p>
                        <p className="text-[#4A7FA5]">{ret.user?.email}</p>
                      </div>
                      <div>
                        <p className="text-[#4A7FA5] text-[10px] mb-0.5">ORDER TOTAL</p>
                        <p className="text-[#FFB700]">{fmt(ret.order_total)}</p>
                      </div>
                      <div>
                        <p className="text-[#4A7FA5] text-[10px] mb-0.5">REASON</p>
                        <p className="text-[#E8F4FD]">{ret.reason}</p>
                      </div>
                      {ret.notes && (
                        <div>
                          <p className="text-[#4A7FA5] text-[10px] mb-0.5">NOTES</p>
                          <p className="text-[#E8F4FD]">{ret.notes}</p>
                        </div>
                      )}
                    </div>

                    {ret.admin_note && (
                      <p className="font-mono text-xs text-[#4A7FA5]">
                        Admin note: <span className="text-[#E8F4FD]">{ret.admin_note}</span>
                      </p>
                    )}
                  </div>

                  <ActionMenu ret={ret} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-cyan disabled:opacity-30"
              >
                ← PREV
              </button>
              <span className="font-mono text-sm text-[#4A7FA5]">{page} / {data.total_pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="btn-cyan disabled:opacity-30"
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
