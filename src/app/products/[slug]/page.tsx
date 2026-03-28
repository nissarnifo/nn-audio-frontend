import type { Metadata } from 'next'
import Script from 'next/script'
import ProductDetailClient from '@/components/product/ProductDetailClient'
import type { Product } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await fetchProduct(params.slug)
  if (!product) {
    return { title: 'Product Not Found' }
  }

  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0]
  const lowestPrice = Math.min(...product.variants.map((v) => v.price))
  const canonical = `${APP_URL}/products/${product.slug}`

  return {
    title: product.name,
    description: product.description,
    keywords: [product.category, product.sku, 'audio', 'India', product.name].join(', '),
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | N & N Audio Systems`,
      description: product.description,
      url: canonical,
      type: 'website',
      images: primaryImage
        ? [{ url: primaryImage.url, width: 800, height: 600, alt: product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: primaryImage ? [primaryImage.url] : [],
    },
    other: {
      'product:price:amount': String(lowestPrice),
      'product:price:currency': 'INR',
    },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug)

  // Build JSON-LD only when product is found
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        sku: product.sku,
        image: product.images.map((i) => i.url),
        brand: { '@type': 'Brand', name: 'N & N Audio Systems' },
        aggregateRating:
          product.review_count > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.review_count,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
        offers: product.variants.map((v) => ({
          '@type': 'Offer',
          name: v.label,
          price: v.price,
          priceCurrency: 'INR',
          availability:
            v.stock_qty > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'N & N Audio Systems' },
          url: `${APP_URL}/products/${product.slug}`,
        })),
      }
    : null

  return (
    <>
      {jsonLd && (
        <Script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />
      )}
      <ProductDetailClient slug={params.slug} />
    </>
  )
}
