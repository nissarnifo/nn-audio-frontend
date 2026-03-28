export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded animate-pulse flex-shrink-0" style={{ background: 'rgba(0,212,255,0.06)' }} />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
            <div className="aspect-square animate-pulse" style={{ background: 'rgba(0,212,255,0.06)' }} />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.08)' }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.06)' }} />
              <div className="h-5 w-2/3 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.08)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
