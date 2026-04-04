'use client'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const accentColor = variant === 'danger' ? '#FF6B6B' : variant === 'warning' ? '#FFB700' : '#00D4FF'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-lg p-6" style={{ background: '#0D1B2A', border: `1px solid ${accentColor}40` }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} style={{ color: accentColor, flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 className="font-heading text-base text-[#E8F4FD] mb-1">{title}</h3>
            <p className="font-mono text-xs text-[#7EB8D4] leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 font-mono text-xs border border-[rgba(0,212,255,0.25)] text-[#7EB8D4] rounded hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 font-mono text-xs rounded transition-colors" style={{ border: `1px solid ${accentColor}60`, color: accentColor, background: `${accentColor}12` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
