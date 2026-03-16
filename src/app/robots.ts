import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/checkout',
          '/cart',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
