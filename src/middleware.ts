// Middleware is intentionally minimal.
// Auth protection is handled at the page/layout level using:
//   - useAuthStore (Zustand) for client components
//   - JWT verification in API routes via src/lib/api-auth.ts
// NextAuth session management is handled by the [...nextauth] route.

export { default } from 'next-auth/middleware'

export const config = {
  // Only run middleware on routes that need session checking
  matcher: [],
}
