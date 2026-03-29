export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[rgba(0,212,255,0.2)] border-t-[#00D4FF] rounded-full animate-spin" />
        <span className="font-mono text-xs text-[#4A7FA5] tracking-widest">LOADING…</span>
      </div>
    </div>
  )
}
