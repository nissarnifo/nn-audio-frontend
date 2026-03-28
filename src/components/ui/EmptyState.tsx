import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-4">
      {icon && <div className="text-[#4A7FA5] mb-2">{icon}</div>}
      <h3 className="font-heading text-lg text-[#E8F4FD] tracking-wide">{title}</h3>
      {description && <p className="text-[#4A7FA5] font-mono text-sm max-w-sm leading-relaxed">{description}</p>}
      {action && (
        action.href ? (
          <Link href={action.href} className="mt-2 px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="mt-2 px-6 py-2.5 border border-[#00D4FF] text-[#00D4FF] font-mono text-sm rounded hover:bg-[rgba(0,212,255,0.1)] transition-colors">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
