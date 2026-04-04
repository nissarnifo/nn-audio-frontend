import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
}

const QUICK_LINKS = [
  { label: 'Amplifiers', href: '/products?category=amplifier' },
  { label: 'Speakers', href: '/products?category=speaker' },
  { label: 'Subwoofers', href: '/products?category=subwoofer' },
  { label: 'Accessories', href: '/products?category=accessory' },
]

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Glitch 404 */}
        <div className="relative mb-6 select-none" aria-hidden="true">
          <p
            className="font-mono text-[120px] font-bold leading-none"
            style={{
              color: 'transparent',
              WebkitTextStroke: '1px rgba(0,212,255,0.3)',
              textShadow: '0 0 40px rgba(0,212,255,0.15)',
            }}
          >
            404
          </p>
          <p
            className="font-mono text-[120px] font-bold leading-none absolute inset-0"
            style={{
              color: 'transparent',
              WebkitTextStroke: '1px #00D4FF',
              clipPath: 'inset(30% 0 50% 0)',
              transform: 'translateX(-4px)',
              opacity: 0.6,
            }}
          >
            404
          </p>
        </div>

        <h1 className="font-heading text-3xl text-[#E8F4FD] tracking-wider mb-3">
          PAGE NOT FOUND
        </h1>
        <p className="text-[#4A7FA5] mb-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <p className="font-mono text-xs text-[#4A7FA5] mb-8">
          ERROR CODE: 404 · ROUTE NOT MATCHED
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link href="/" className="btn-gold px-8 py-3 font-heading tracking-widest">
            GO HOME
          </Link>
          <Link href="/products" className="btn-cyan px-8 py-3 font-heading tracking-widest">
            SHOP PRODUCTS
          </Link>
        </div>

        {/* Quick category links */}
        <div className="hud-card p-6">
          <p className="font-mono text-xs text-[#4A7FA5] mb-4 tracking-widest">QUICK LINKS</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs text-[#00D4FF] border border-[rgba(0,212,255,0.2)] px-4 py-2 rounded hover:border-[rgba(0,212,255,0.6)] hover:bg-[rgba(0,212,255,0.06)] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
