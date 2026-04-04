export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-56 rounded animate-pulse" style={{ background: 'rgba(0,212,255,0.08)' }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.08)' }} />
        ))}
      </div>
      <div className="h-64 rounded-lg animate-pulse" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }} />
    </div>
  )
}
