'use client'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useState } from 'react'
import { usePublicSettings } from '@/hooks'

const COLOR_MAP: Record<string, { bar: string; text: string; close: string }> = {
  cyan:  { bar: 'bg-[rgba(0,212,255,0.12)] border-[rgba(0,212,255,0.25)]',   text: 'text-[#00D4FF]', close: 'hover:text-[#00D4FF]' },
  gold:  { bar: 'bg-[rgba(255,183,0,0.12)] border-[rgba(255,183,0,0.3)]',    text: 'text-[#FFB700]', close: 'hover:text-[#FFB700]' },
  red:   { bar: 'bg-[rgba(255,51,102,0.1)] border-[rgba(255,51,102,0.25)]',  text: 'text-[#FF3366]', close: 'hover:text-[#FF3366]' },
  green: { bar: 'bg-[rgba(0,255,136,0.08)] border-[rgba(0,255,136,0.2)]',   text: 'text-[#00FF88]', close: 'hover:text-[#00FF88]' },
}

export default function AnnouncementBanner() {
  const { data: settings } = usePublicSettings()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (!settings) return null
  if (settings.banner_enabled !== 'true') return null
  if (!settings.banner_text?.trim()) return null

  const colorKey = settings.banner_color in COLOR_MAP ? settings.banner_color : 'cyan'
  const { bar, text, close } = COLOR_MAP[colorKey]

  const content = (
    <span className={`font-mono text-xs tracking-wide ${text}`}>
      {settings.banner_text}
    </span>
  )

  return (
    <div className={`relative flex items-center justify-center px-8 py-2 border-b ${bar}`}>
      {settings.banner_link?.trim() ? (
        <Link href={settings.banner_link} className="hover:underline underline-offset-2">
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className={`absolute right-3 text-[#4A7FA5] ${close} transition-colors`}
      >
        <X size={14} />
      </button>
    </div>
  )
}
