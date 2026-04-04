'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import CompareBar from '@/components/CompareBar'

// Routes where the customer navbar/footer/compare bar should NOT appear
const EXCLUDED_PREFIXES = ['/admin', '/auth']

export default function StorefrontShell() {
  const pathname = usePathname()
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (isExcluded) return null

  return (
    <>
      <AnnouncementBanner />
      <Navbar />
      <CompareBar />
      {/* Footer is rendered by the shell so it appears below <main> */}
    </>
  )
}
