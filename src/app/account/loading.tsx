export default function AccountLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-48 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.08)' }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="h-4 w-1/3 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.08)' }} />
          <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.06)' }} />
          <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.06)' }} />
        </div>
      ))}
    </div>
  )
}
