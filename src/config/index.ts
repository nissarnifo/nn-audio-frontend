/**
 * CENTRAL CONFIGURATION — src/config/index.ts
 *
 * ALL environment variables are read exactly once, here.
 *
 * LOOSE COUPLING GUIDE — to migrate after 3 months to your own server:
 *   1. Change NEXT_PUBLIC_API_URL  → points to any backend, anywhere
 *   2. Change NEXTAUTH_URL         → your own domain
 *   3. Change NEXTAUTH_SECRET      → new random secret
 *   4. Set Razorpay live key       → switch from test to production
 *   5. That's it. Zero code changes needed.
 *
 * CURRENT STACK (3-month free tier):
 *   Frontend  → Vercel (free)
 *   Backend   → Render (free)
 *   Database  → Neon PostgreSQL (free, via render.yaml)
 *   Storage   → Cloudinary (free tier)
 *   Payments  → Razorpay
 *
 * FUTURE STACK (own server):
 *   Frontend  → Any CDN / VPS / Docker
 *   Backend   → Any Node server / Docker
 *   Database  → Any PostgreSQL (same schema, pg_dump → restore)
 *   Storage   → Any S3-compatible / Cloudinary / own
 */

// ─── Backend API ───────────────────────────────────────────────────────────────
// Backend is now co-located as Next.js API routes on Vercel.
// In development, NEXT_PUBLIC_API_URL can override to a local Express server.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'

// ─── Payments ──────────────────────────────────────────────────────────────────
// Switch from test to live by updating NEXT_PUBLIC_RAZORPAY_KEY_ID in .env
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

// ─── OAuth Providers (all optional — enable by adding keys to .env) ───────────
export const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    enabled: !!(
      process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_CLIENT_SECRET !== 'PASTE_YOUR_SECRET_HERE'
    ),
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    enabled: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
  },
} as const

// ─── Image Hosting ─────────────────────────────────────────────────────────────
// Add your own CDN hostname here when migrating to own server
export const allowedImageHostnames = [
  'res.cloudinary.com',
  'images.unsplash.com',
] as const

// ─── API Endpoint Paths ────────────────────────────────────────────────────────
// All backend routes defined here — change once if backend URL structure changes
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    mePassword: '/auth/me/password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    logout: '/auth/logout',
    oauth: '/auth/oauth',
  },
  products: {
    list: '/products',
    bySlug: (slug: string) => `/products/${slug}`,
    byId: (id: string) => `/products/id/${id}`,
    create: '/products',
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
    images: (id: string) => `/products/${id}/images`,
    imagePrimary: (productId: string, imageId: string) =>
      `/products/${productId}/images/${imageId}/primary`,
    imageDelete: (productId: string, imageId: string) =>
      `/products/${productId}/images/${imageId}`,
    reviews: (slug: string) => `/products/${slug}/reviews`,
  },
  cart: {
    root: '/cart',
    items: '/cart/items',
    item: (id: string) => `/cart/items/${id}`,
  },
  orders: {
    root: '/orders',
    byId: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  addresses: {
    root: '/addresses',
    byId: (id: string) => `/addresses/${id}`,
    setDefault: (id: string) => `/addresses/${id}/default`,
  },
  payments: {
    razorpayOrder: '/payments/razorpay/order',
    razorpayVerify: '/payments/razorpay/verify',
  },
  admin: {
    stats: '/admin/stats',
    orders: '/admin/orders',
    orderStatus: (id: string) => `/admin/orders/${id}/status`,
    customers: '/admin/customers',
    inventory: '/admin/inventory',
    inventoryRestock: '/admin/inventory/restock',
    inventoryAdjust: '/admin/inventory/adjust',
    inventoryMovements: '/admin/inventory/movements',
  },
} as const
