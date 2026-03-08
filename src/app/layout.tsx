import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'N & N Audio Systems — Precision Audio, Made in India',
  description:
    'Premium amplifiers, speakers, subwoofers and audio equipment. Shop N & N Audio Systems — trusted by audiophiles across India.',
  keywords: 'audio systems, amplifier, speaker, subwoofer, car audio, India',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="hud-grid flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
