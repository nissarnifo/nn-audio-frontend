/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window algorithm per IP address.
 * Note: For multi-instance deployments, use Redis-backed limiter instead.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.limit - entry.count)
  return {
    success: entry.count <= config.limit,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
  }
}

/** Pre-configured limiters */
export const limiters = {
  /** Auth endpoints: 10 req / 15 min per IP */
  auth: (ip: string) => rateLimit(`auth:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 }),
  /** General API: 120 req / 60 sec per IP */
  api: (ip: string) => rateLimit(`api:${ip}`, { limit: 120, windowMs: 60 * 1000 }),
  /** Payments: 10 req / 10 min per IP */
  payment: (ip: string) => rateLimit(`payment:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 }),
  /** Coupon validation: 20 req / 10 min per IP */
  coupon: (ip: string) => rateLimit(`coupon:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 }),
}

/** Extract IP from Next.js request headers */
export function getIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Returns a NextResponse with 429 status if rate limited */
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.success) return null
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  )
}
