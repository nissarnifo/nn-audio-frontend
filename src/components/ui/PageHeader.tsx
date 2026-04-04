import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-3 text-[11px] font-mono text-[#4A7FA5]">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[#00D4FF] transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-[#A8C8E0]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-[#E8F4FD] tracking-wide">{title}</h1>
          {subtitle && <p className="text-[#4A7FA5] font-mono text-xs mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
