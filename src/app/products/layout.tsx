import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'

export const metadata: Metadata = {
  title: 'Shop All Products',
  description:
    'Browse our full range of car and home audio equipment — amplifiers, speakers, subwoofers, processors, cables and more. Free shipping on orders above ₹999.',
  keywords: 'audio equipment, car audio, home audio, amplifier, speaker, subwoofer, India',
  alternates: { canonical: `${APP_URL}/products` },
  openGraph: {
    title: 'Shop All Products | N & N Audio Systems',
    description:
      'Browse amplifiers, speakers, subwoofers and more. Premium audio equipment trusted by audiophiles across India.',
    url: `${APP_URL}/products`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shop All Products | N & N Audio Systems',
    description: 'Premium amplifiers, speakers, subwoofers and audio equipment.',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
