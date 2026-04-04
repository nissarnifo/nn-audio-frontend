import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Routes that require authentication — Clerk will redirect to sign-in if not logged in
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/cart',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|ttf|woff2?|bmp|ico|gif|jpe?g|jpg|png|svg|webp)).*)',
    '/(api|trpc)(.*)',
  ],
}
