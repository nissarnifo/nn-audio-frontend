import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

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

  if (!email) {
    return NextResponse.json({ error: 'No email found on Clerk user' }, { status: 400 })
  }

  const firstName = clerkUser.firstName ?? ''
  const lastName = clerkUser.lastName ?? ''
  const name = [firstName, lastName].filter(Boolean).join(' ') || email

  // Use real OAuth provider (google/github) or fall back to clerkId lookup
  const externalAccount = clerkUser.externalAccounts?.[0]
  const provider = externalAccount?.provider ?? null
  const providerId = externalAccount?.externalId ?? null

  try {
    const db = prisma.user as any

    // Look up by OAuth provider ID first, then fall back to email
    const providerWhere =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : null

    let user = providerWhere
      ? ((await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } })))
      : await db.findUnique({ where: { email } })

    const providerData =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : {}

    if (user) {
      // Link provider ID if not already linked
      if (provider && !user[`${provider}Id`]) {
        user = await db.update({ where: { id: user.id }, data: providerData })
      }
    } else {
      // Create new user
      user = await db.create({ data: { name, email, ...providerData } })
    }

    return NextResponse.json({
      token: signToken(user.id, user.role),
      user: safeUser(user),
    })
  } catch (e) {
    console.error('[clerk-sync] DB error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
