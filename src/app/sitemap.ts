import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: APP_URL,            lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${APP_URL}/products`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${APP_URL}/auth/login`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/auth/register`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Dynamic product pages
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/products?limit=200`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      productEntries = (data.data ?? []).map((p: { slug: string; created_at: string }) => ({
        url: `${APP_URL}/products/${p.slug}`,
        lastModified: new Date(p.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    // Silently skip product entries if API is unavailable at build time
  }

  return [...statics, ...productEntries]
}
