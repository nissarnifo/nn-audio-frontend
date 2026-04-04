import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-auth'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session || !session.oauthProvider || !session.oauthProviderId) {
    return NextResponse.json({ error: 'No OAuth session found' }, { status: 401 })
  }

  // If the JWT callback already synced successfully, return the cached result
  if (session.backendToken && session.backendUser) {
    return NextResponse.json({ token: session.backendToken, user: session.backendUser })
  }

  try {
    const provider = session.oauthProvider as 'google' | 'github' | 'discord'
    const providerId = session.oauthProviderId

    const providerWhere =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    const providerData =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    const db = prisma.user as any
    let user =
      (await db.findUnique({ where: providerWhere })) ??
      (await db.findUnique({ where: { email: session.oauthEmail } }))

    if (user) {
      if (!user[`${provider}Id`]) {
        user = await db.update({ where: { id: user.id }, data: providerData })
      }
    } else {
      user = await db.create({
        data: { name: session.oauthName || session.oauthEmail, email: session.oauthEmail, ...providerData },
      })
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt }
    return NextResponse.json({ token: signToken(user.id, user.role), user: safeUser })
  } catch (err) {
    console.error('sync-oauth failed', err)
    return NextResponse.json({ error: 'OAuth sync failed' }, { status: 500 })
  }
}
