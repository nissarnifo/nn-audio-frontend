import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { API_BASE_URL, ENDPOINTS } from '@/config'

/**
 * POST /api/auth/clerk-sync
 *
 * Called by ClerkSync.tsx after a successful Clerk sign-in.
 * Forwards the Clerk user's identity to the backend /auth/oauth endpoint
 * to create or retrieve the backend JWT + user record (with role info).
 *
 * The backend must accept provider="clerk" as a valid OAuth provider.
 * If it only accepts google/github/discord, add "clerk" to the backend's
 * provider whitelist (one-line change on the backend).
 */
export async function POST() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

  const firstName = clerkUser.firstName ?? ''
  const lastName = clerkUser.lastName ?? ''
  const name = [firstName, lastName].filter(Boolean).join(' ') || email

  // Phone stored in Clerk unsafe metadata during registration
  const phone = (clerkUser.unsafeMetadata as { phone?: string })?.phone ?? ''

  // Use the actual OAuth provider (google/github) if user signed in via OAuth
  // Fall back to 'clerk' for email/password users
  const externalAccount = clerkUser.externalAccounts?.[0]
  const provider = externalAccount?.provider ?? 'clerk'
  const providerId = externalAccount?.externalId ?? clerkUser.id

  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.oauth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        providerId,
        email,
        name,
        phone,
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as { message?: string }).message || 'Backend sync failed' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({ token: data.token, user: data.user })
  } catch (err) {
    console.error('[clerk-sync] Backend unreachable:', err)
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 })
  }
}
