'use client'
import { useState } from 'react'
import { MessageCircle, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useAdminQuestions, useAnswerQuestion, useDeleteQuestion } from '@/hooks'
import { PageLoading, SectionHeader, Pagination, Spinner } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import type { Question } from '@/types'
import toast from 'react-hot-toast'

export default function AdminQuestionsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({})

  const params = {
    page,
    ...(filter === 'unanswered' ? { answered: false } : filter === 'answered' ? { answered: true } : {}),
  }

  const { data, isLoading } = useAdminQuestions(params)
  const { mutate: answerQ, isPending: isAnswering } = useAnswerQuestion()
  const { mutate: deleteQ, isPending: isDeleting } = useDeleteQuestion()

  if (isLoading) return <PageLoading />

  const questions: Question[] = data?.data ?? []
  const totalPages = data?.total_pages ?? 1

  function handleAnswer(q: Question) {
    const answer = answerDraft[q.id]?.trim()
    if (!answer) { toast.error('Enter an answer first'); return }
    answerQ({ id: q.id, answer }, {
      onSuccess: () => {
        setAnswerDraft((d) => { const n = { ...d }; delete n[q.id]; return n })
        setExpanded(null)
      },
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    deleteQ(id)
  }

  const FILTER_OPTS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'unanswered', label: 'UNANSWERED' },
    { key: 'answered', label: 'ANSWERED' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SectionHeader title="Q&A" subtitle="Customer product questions" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTER_OPTS.map((o) => (
          <button
            key={o.key}
            onClick={() => { setFilter(o.key); setPage(1) }}
            className={`px-4 py-1.5 rounded font-mono text-xs tracking-widest border transition-all ${
              filter === o.key
                ? 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.4)]'
            }`}
          >
            {o.label}
          </button>
        ))}
        {data?.total !== undefined && (
          <span className="ml-auto font-mono text-xs text-[#4A7FA5] self-center">{data.total} total</span>
        )}
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="hud-card p-16 text-center">
            <MessageCircle size={32} className="text-[#4A7FA5] mx-auto mb-3" />
            <p className="font-heading text-lg text-[#4A7FA5]">No questions found.</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="hud-card overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-3 p-4">
                <span className="font-mono text-xs text-[#FFB700] mt-0.5 flex-shrink-0">Q</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-[#E8F4FD]">{q.question}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="font-mono text-[10px] text-[#4A7FA5]">{q.user?.name}</span>
                    <span className="font-mono text-[10px] text-[#4A7FA5]">{q.user?.email}</span>
                    <span className="font-mono text-[10px] text-[#4A7FA5]">{fmtDate(q.created_at)}</span>
                    {q.product && (
                      <span className="font-mono text-[10px] text-[#00D4FF]">{q.product.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.answer ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,255,136,0.3)] text-[#00FF88] bg-[rgba(0,255,136,0.05)]">ANSWERED</span>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[rgba(255,183,0,0.3)] text-[#FFB700] bg-[rgba(255,183,0,0.05)]">PENDING</span>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="text-[#4A7FA5] hover:text-[#00D4FF] transition-colors"
                    aria-label="Toggle answer"
                  >
                    {expanded === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={isDeleting}
                    className="text-[#4A7FA5] hover:text-[#FF3366] transition-colors"
                    aria-label="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Existing answer */}
              {q.answer && (
                <div className="border-t border-[rgba(0,212,255,0.08)] px-4 py-3 flex gap-2 bg-[rgba(0,212,255,0.02)]">
                  <span className="font-mono text-xs text-[#00D4FF] mt-0.5 flex-shrink-0">A</span>
                  <p className="font-mono text-sm text-[#4A7FA5] leading-relaxed">{q.answer}</p>
                </div>
              )}

              {/* Answer form */}
              {expanded === q.id && (
                <div className="border-t border-[rgba(0,212,255,0.08)] p-4">
                  <p className="font-mono text-[10px] text-[#4A7FA5] mb-2 tracking-widest">
                    {q.answer ? 'EDIT ANSWER' : 'WRITE ANSWER'}
                  </p>
                  <textarea
                    value={answerDraft[q.id] ?? q.answer ?? ''}
                    onChange={(e) => setAnswerDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                    rows={3}
                    className="input-hud w-full resize-none mb-3"
                    placeholder="Type your answer..."
                  />
                  <button
                    onClick={() => handleAnswer(q)}
                    disabled={isAnswering}
                    className="btn-cyan flex items-center gap-2 text-sm px-4 py-2"
                  >
                    {isAnswering ? <Spinner size={13} /> : <Check size={13} />}
                    {q.answer ? 'UPDATE ANSWER' : 'PUBLISH ANSWER'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}
