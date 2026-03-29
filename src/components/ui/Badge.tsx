import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-[rgba(0,212,255,0.3)] text-[#7EB8D4] bg-[rgba(0,212,255,0.06)]',
  success: 'border-[rgba(0,255,136,0.3)] text-[#00FF88] bg-[rgba(0,255,136,0.06)]',
  warning: 'border-[rgba(255,183,0,0.3)] text-[#FFB700] bg-[rgba(255,183,0,0.06)]',
  danger:  'border-[rgba(255,107,107,0.3)] text-[#FF6B6B] bg-[rgba(255,107,107,0.06)]',
  info:    'border-[rgba(0,212,255,0.4)] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]',
  gold:    'border-[rgba(255,183,0,0.5)] text-[#FFB700] bg-[rgba(255,183,0,0.1)]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border', variantStyles[variant], className)}>
      {children}
    </span>
  )
}

/** Map order/payment/return status strings to badge variants */
export function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PROCESSING: 'warning',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    PAID: 'success',
    PENDING: 'warning',
    FAILED: 'danger',
    REFUNDED: 'info',
    REQUESTED: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    ACTIVE: 'success',
    INACTIVE: 'danger',
  }
  return map[status] ?? 'default'
}
