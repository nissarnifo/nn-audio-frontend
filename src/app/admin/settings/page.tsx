'use client'
import { useEffect, useState } from 'react'
import { Settings, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useAllSettings, useUpdateSettings } from '@/hooks'
import { SectionHeader, Spinner } from '@/components/ui'

const COLORS = [
  { value: 'cyan',  label: 'Cyan',  dot: 'bg-[#00D4FF]' },
  { value: 'gold',  label: 'Gold',  dot: 'bg-[#FFB700]' },
  { value: 'red',   label: 'Red',   dot: 'bg-[#FF3366]' },
  { value: 'green', label: 'Green', dot: 'bg-[#00FF88]' },
]

const COLOR_PREVIEW: Record<string, string> = {
  cyan:  'bg-[rgba(0,212,255,0.12)] border-[rgba(0,212,255,0.25)] text-[#00D4FF]',
  gold:  'bg-[rgba(255,183,0,0.12)] border-[rgba(255,183,0,0.3)] text-[#FFB700]',
  red:   'bg-[rgba(255,51,102,0.1)] border-[rgba(255,51,102,0.25)] text-[#FF3366]',
  green: 'bg-[rgba(0,255,136,0.08)] border-[rgba(0,255,136,0.2)] text-[#00FF88]',
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAllSettings()
  const { mutate: save, isPending } = useUpdateSettings()

  const [enabled, setEnabled] = useState(false)
  const [text, setText] = useState('')
  const [color, setColor] = useState('cyan')
  const [link, setLink] = useState('')

  // Sync from server on first load
  useEffect(() => {
    if (!settings) return
    setEnabled(settings.banner_enabled === 'true')
    setText(settings.banner_text ?? '')
    setColor(settings.banner_color ?? 'cyan')
    setLink(settings.banner_link ?? '')
  }, [settings])

  function handleSave() {
    save({
      banner_enabled: enabled ? 'true' : 'false',
      banner_text: text,
      banner_color: color,
      banner_link: link,
    })
  }

  const previewClass = COLOR_PREVIEW[color] ?? COLOR_PREVIEW.cyan

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <SectionHeader title="STORE SETTINGS" />
        <Settings size={18} className="text-[#4A7FA5]" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={24} /></div>
      ) : (
        <div className="space-y-6">
          {/* ── Announcement Banner ── */}
          <div className="hud-card p-6">
            <h2 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-1">ANNOUNCEMENT BANNER</h2>
            <p className="font-mono text-xs text-[#4A7FA5] mb-6">
              Shown at the top of every storefront page. Useful for flash sales, shipping notices, or promotions.
            </p>

            {/* Enable toggle */}
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-xs text-[#4A7FA5] tracking-widest">ENABLED</span>
              <button
                onClick={() => setEnabled((v) => !v)}
                className={`flex items-center gap-1.5 font-mono text-xs transition-colors ${enabled ? 'text-[#00FF88]' : 'text-[#4A7FA5]'}`}
              >
                {enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                {enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Banner text */}
            <div className="mb-4">
              <label className="font-mono text-xs text-[#4A7FA5] block mb-1.5 tracking-widest">MESSAGE</label>
              <input
                className="input-hud w-full text-sm"
                placeholder="e.g. 🎉 Free shipping on orders above ₹5,000 this weekend!"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
              />
              <p className="font-mono text-[10px] text-[rgba(74,127,165,0.5)] mt-1 text-right">{text.length}/200</p>
            </div>

            {/* Link */}
            <div className="mb-4">
              <label className="font-mono text-xs text-[#4A7FA5] block mb-1.5 tracking-widest">
                LINK <span className="text-[rgba(74,127,165,0.5)]">(optional)</span>
              </label>
              <div className="relative">
                <input
                  className="input-hud w-full text-sm pr-8"
                  placeholder="/products?on_sale=true"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                {link && (
                  <ExternalLink size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A7FA5]" />
                )}
              </div>
            </div>

            {/* Color picker */}
            <div className="mb-6">
              <label className="font-mono text-xs text-[#4A7FA5] block mb-2 tracking-widest">ACCENT COLOR</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-all ${
                      color === c.value
                        ? 'border-[rgba(255,255,255,0.3)] text-[#E8F4FD]'
                        : 'border-[rgba(0,212,255,0.15)] text-[#4A7FA5] hover:border-[rgba(0,212,255,0.3)]'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            {text.trim() && (
              <div className="mb-6">
                <p className="font-mono text-[10px] text-[#4A7FA5] tracking-widest mb-2">PREVIEW</p>
                <div className={`flex items-center justify-center px-8 py-2 border rounded ${previewClass}`}>
                  <span className="font-mono text-xs">{text}</span>
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-gold px-6 py-2.5 font-heading tracking-widest text-sm flex items-center gap-2"
            >
              {isPending && <Spinner size={14} />}
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
