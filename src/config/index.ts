/**
 * CENTRAL CONFIGURATION — src/config/index.ts
 *
 * Single-server setup: Next.js handles both frontend and API routes.
 * All API calls go to /api/* (same origin — no CORS, no external server).
 *
 * Environment variables needed:
 *   DATABASE_URL          → PostgreSQL connection string (Vercel Postgres / Neon)
 *   DIRECT_URL            → Direct DB URL (required by Vercel Postgres / Neon)
 *   JWT_SECRET            → Random secret for signing tokens (min 32 chars)
 *   NEXTAUTH_SECRET       → Random secret for NextAuth
 *   NEXTAUTH_URL          → Your app URL (auto-set on Vercel)
 *   CLOUDINARY_CLOUD_NAME → Cloudinary cloud name
 *   CLOUDINARY_API_KEY    → Cloudinary API key
 *   CLOUDINARY_API_SECRET → Cloudinary API secret
 *   RAZORPAY_KEY_ID       → Razorpay key ID (public)
 *   RAZORPAY_KEY_SECRET   → Razorpay key secret
 *   EMAIL_USER            → SMTP username (optional — for password reset emails)
 *   EMAIL_PASS            → SMTP password (optional)
 *   TELEGRAM_BOT_TOKEN    → Telegram bot token (optional — for order notifications)
 *   TELEGRAM_CHAT_ID      → Telegram chat ID (optional)
 */

// ─── API base — empty string = same origin (Next.js API routes at /api/*) ──────
export const API_BASE_URL = '/api'

// ─── Payments ──────────────────────────────────────────────────────────────────
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
export const allowedImageHostnames = [
  'res.cloudinary.com',
  'images.unsplash.com',
] as const

// ─── API Endpoint Paths ────────────────────────────────────────────────────────
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
    byId: (id: string) => `/products/${id}`,        // smart detection: slug or cuid
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
