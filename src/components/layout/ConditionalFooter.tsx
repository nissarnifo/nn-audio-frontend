'use client'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

const EXCLUDED_PREFIXES = ['/admin', '/auth']

export default function ConditionalFooter() {
  const pathname = usePathname()
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return <Footer />
}
