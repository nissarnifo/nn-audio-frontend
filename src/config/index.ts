/**
 * CENTRAL CONFIGURATION — src/config/index.ts
 *
 * ALL environment variables are read exactly once, here.
 *
 * LOOSE COUPLING GUIDE — to migrate to your own server:
 *   1. Change NEXT_PUBLIC_API_URL  → points to any backend, anywhere
 *   2. Set Razorpay live key       → switch from test to production
 *   3. Update Clerk keys           → use production Clerk instance
 *   4. That's it. Zero code changes needed.
 *
 * CURRENT STACK:
 *   Auth      → Clerk (identity + session management)
 *   Frontend  → Vercel
 *   Backend   → Render (issues backend JWT after Clerk sync)
 *   Database  → Neon PostgreSQL
 *   Storage   → Cloudinary
 *   Payments  → Razorpay
 */

// ─── Backend API ───────────────────────────────────────────────────────────────
// The API now runs as Next.js Route Handlers on the same Vercel project.
// In production, NEXT_PUBLIC_API_URL should be omitted (relative /api/v1 works automatically)
// or set to https://audiosets.store/api/v1
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'

// ─── App (Frontend) URL ────────────────────────────────────────────────────────
// Used for canonical URLs, sitemap, OG tags
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://nnaudio.in'

// ─── Payments ──────────────────────────────────────────────────────────────────
// Switch from test to live by updating NEXT_PUBLIC_RAZORPAY_KEY_ID in .env
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

// ─── OAuth Providers — now managed in the Clerk Dashboard ─────────────────────
// Enable Google, GitHub, Discord, etc. from: https://dashboard.clerk.com
// No environment variables needed on the frontend for OAuth any more.

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
