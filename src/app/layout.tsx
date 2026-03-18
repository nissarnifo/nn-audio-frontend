import type { Metadata } from 'next'
import './globals.css'
import StorefrontShell from '@/components/layout/StorefrontShell'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import Providers from './providers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'N & N Audio Systems — Precision Audio, Made in India',
    template: '%s | N & N Audio Systems',
  },
  description:
    'Premium amplifiers, speakers, subwoofers and audio equipment. Shop N & N Audio Systems — trusted by audiophiles across India.',
  keywords: 'audio systems, amplifier, speaker, subwoofer, car audio, India, N&N Audio',
  authors: [{ name: 'N & N Audio Systems', url: APP_URL }],
  creator: 'N & N Audio Systems',
  openGraph: {
    siteName: 'N & N Audio Systems',
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    title: 'N & N Audio Systems — Precision Audio, Made in India',
    description:
      'Premium amplifiers, speakers, subwoofers and audio equipment. Trusted by audiophiles across India.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'N & N Audio Systems',
    description: 'Premium audio equipment. Trusted by audiophiles across India.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
        {/* Razorpay SDK — loaded once globally so window.Razorpay is always available */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="hud-grid flex flex-col min-h-screen">
        <Providers>
          <StorefrontShell />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  )
}
