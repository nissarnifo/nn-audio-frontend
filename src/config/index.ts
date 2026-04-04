/**
 * CENTRAL CONFIGURATION — src/config/index.ts
 *
 * Single-server setup: Next.js handles both frontend and API routes.
 * All API calls go to /api/* (same origin — no CORS, no external server).
 *
 * Environment variables needed:
 *   DATABASE_URL                       → PostgreSQL connection string (Neon / Supabase)
 *   DIRECT_URL                         → Direct DB URL (optional — for Neon with connection pooling)
 *   JWT_SECRET                         → Random secret for signing backend tokens (min 32 chars)
 *   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  → Clerk publishable key (from Clerk dashboard)
 *   CLERK_SECRET_KEY                   → Clerk secret key (from Clerk dashboard)
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

// ─── App (Frontend) URL ────────────────────────────────────────────────────────
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'

// ─── OAuth Providers — dynamically enabled based on env vars ──────────────────
export const oauthConfig = {
  google: {
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  github: {
    enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },
  discord: {
    enabled: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  },
}

// ─── Payments ──────────────────────────────────────────────────────────────────
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

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
    sale: (id: string) => `/products/${id}/sale`,
    questions: (slug: string) => `/products/${slug}/questions`,
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
  coupons: {
    validate: '/coupons/validate',
    root: '/coupons',
    byId: (id: string) => `/coupons/${id}`,
    usage: (id: string) => `/coupons/${id}/usage`,
  },
  stockAlerts: {
    subscribe: '/stock-alerts',
    adminList: '/stock-alerts/admin',
  },
  returns: {
    root: '/returns',
    me: '/returns/me',
  },
  wishlist: {
    root: '/wishlist',
    item: (productId: string) => `/wishlist/${productId}`,
  },
  settings: {
    public: '/settings',
    all: '/settings/all',
    update: '/settings',
  },
  newsletter: {
    subscribe: '/newsletter/subscribe',
    unsubscribe: '/newsletter/unsubscribe',
    subscribers: '/newsletter/subscribers',
    export: '/newsletter/export',
    deleteSubscriber: (id: string) => `/newsletter/subscribers/${id}`,
  },
  admin: {
    stats: '/admin/stats',
    analytics: '/admin/analytics',
    orders: '/admin/orders',
    orderStatus: (id: string) => `/admin/orders/${id}/status`,
    customers: '/admin/customers',
    customerById: (id: string) => `/admin/customers/${id}`,
    inventory: '/admin/inventory',
    inventoryRestock: '/admin/inventory/restock',
    inventoryAdjust: '/admin/inventory/adjust',
    inventoryMovements: '/admin/inventory/movements',
    returns: '/admin/returns',
    returnStatus: (id: string) => `/admin/returns/${id}/status`,
    questions: '/admin/questions',
    questionById: (id: string) => `/admin/questions/${id}`,
    notifications: '/admin/notifications',
    reviews: '/admin/reviews',
    reviewById: (id: string) => `/admin/reviews/${id}`,
  },
} as const
