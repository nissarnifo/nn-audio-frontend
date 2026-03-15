/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── NextAuth URL — server-side runtime config ────────────────────────────
  // serverRuntimeConfig is read at runtime on the server only (not bundled into client).
  // VERCEL_URL is injected by Vercel for every deployment (preview + production).
  // On preview: "nn-audio-xyz-git-branch.vercel.app"
  // On production: your assigned domain
  // Locally: falls back to NEXTAUTH_URL from .env.local
  serverRuntimeConfig: {
    NEXTAUTH_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL,
  },

  // ─── Public env — available in browser bundle ─────────────────────────────
  // NEXT_PUBLIC_API_URL must be set in Vercel for all environments (Preview + Production).
  // NEXTAUTH_URL_INTERNAL: tells NextAuth server callbacks to use the correct URL.
  env: {
    NEXTAUTH_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  },

  // ─── Image Optimization ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // ─── Security Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
