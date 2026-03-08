'use client'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

/* ─── Stars ──────────────────────────────────────────────────────── */
export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating) ? 'fill-[#FFB700] text-[#FFB700]' : 'text-[#4A7FA5]'}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-[#4A7FA5] ml-1 font-mono">({count})</span>
      )}
    </div>
  )
}

/* ─── Badge ──────────────────────────────────────────────────────── */
export function Badge({
  children,
  color = 'cyan',
  className,
}: {
  children: React.ReactNode
  color?: 'cyan' | 'gold' | 'green' | 'red' | 'muted'
  className?: string
}) {
  const colors = {
    cyan: 'border-[#00D4FF] text-[#00D4FF] bg-[rgba(0,212,255,0.08)]',
    gold: 'border-[#FFB700] text-[#FFB700] bg-[rgba(255,183,0,0.08)]',
    green: 'border-[#00FF88] text-[#00FF88] bg-[rgba(0,255,136,0.08)]',
    red: 'border-[#FF3366] text-[#FF3366] bg-[rgba(255,51,102,0.08)]',
    muted: 'border-[#4A7FA5] text-[#4A7FA5] bg-[rgba(74,127,165,0.08)]',
  }
  return (
    <span
      className={cn(
        'status-badge font-mono text-xs px-2 py-0.5',
        colors[color],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ─── Status Badge ───────────────────────────────────────────────── */
const statusColors: Record<OrderStatus, 'cyan' | 'gold' | 'green' | 'red'> = {
  PROCESSING: 'gold',
  SHIPPED: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge color={statusColors[status]}>{status}</Badge>
}

/* ─── Divider ────────────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-px w-full bg-[rgba(0,212,255,0.12)]', className)}
    />
  )
}

/* ─── Spinner ────────────────────────────────────────────────────── */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-[#00D4FF]', className)}
    />
  )
}

/* ─── Section Header ─────────────────────────────────────────────── */
export function SectionHeader({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="font-heading text-3xl text-[#E8F4FD] mb-2 tracking-wide">{title}</h2>
      {subtitle && <p className="text-[#4A7FA5] text-sm">{subtitle}</p>}
      <div className="mt-3 h-0.5 w-16 bg-[#00D4FF]" />
    </div>
  )
}

/* ─── Empty State ────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-[#4A7FA5]">{icon}</div>}
      <h3 className="font-heading text-xl text-[#E8F4FD] mb-2">{title}</h3>
      {description && <p className="text-[#4A7FA5] text-sm mb-6 max-w-md">{description}</p>}
      {action}
    </div>
  )
}

/* ─── No Photo ───────────────────────────────────────────────────── */
export function NoPhoto({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-[#0D1B2A] text-[#4A7FA5] text-xs font-mono',
        className
      )}
    >
      NO IMAGE
    </div>
  )
}

/* ─── Page Loading ───────────────────────────────────────────────── */
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size={32} />
    </div>
  )
}
