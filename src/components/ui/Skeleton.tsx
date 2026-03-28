import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rect' && 'rounded',
        className
      )}
      style={{ background: 'rgba(0,212,255,0.07)' }}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-1" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
