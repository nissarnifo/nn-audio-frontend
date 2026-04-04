export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-auth'

function safeUser(u: { id: string; name: string; email: string; phone: string | null; role: string; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

// POST /api/auth/clerk-sync
// Called by ClerkSync component after every Clerk sign-in.
// Finds or creates the user in our DB and returns a backend JWT.
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null
    const firstName = clerkUser.firstName ?? ''
    const lastName = clerkUser.lastName ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || clerkUser.username || 'User'

    // Find existing user by clerkId or email (links existing email/password accounts)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (user) {
      // Link clerkId if this is an existing email/password account signing in via Clerk for first time
      if (!user.clerkId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId: userId },
        })
      }
    } else {
      // New user — create in DB
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          name,
          email: email ?? `${userId}@clerk.local`,
          phone: null,
          role: 'CUSTOMER',
        },
      })
    }

    return NextResponse.json({
      user: safeUser(user),
      token: signToken(user.id, user.role),
    })
  } catch (e) {
    console.error('[clerk-sync]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
