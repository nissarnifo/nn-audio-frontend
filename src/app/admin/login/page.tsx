'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /admin/login — redirects to the main sign-in page.
 * Admin authentication now goes through Clerk (same login flow).
 * After sign-in, ClerkSync syncs the backend JWT and role.
 * AdminLayout grants access only when isAdmin === true.
 */
export default function AdminLoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/auth/login')
  }, [router])
  return null
}
