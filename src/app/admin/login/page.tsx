'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

/**
 * /admin/login — redirects to the main sign-in page.
 * Admin authentication now goes through Clerk (same login flow).
 * After sign-in, ClerkSync syncs the backend JWT and role.
 * AdminLayout grants access only when isAdmin === true.
 */
export default function AdminLoginRedirect() {
  const router = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      router.replace('/admin')
    } else {
      router.replace('/auth/login?from=/admin')
    }
  }, [isLoggedIn, isAdmin, router])

  return null
}
