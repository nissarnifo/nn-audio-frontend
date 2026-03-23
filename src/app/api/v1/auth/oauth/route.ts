export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-helpers'

function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const { provider, providerId, email, name } = await req.json()

    if (!provider || !providerId || !email) {
      return NextResponse.json({ error: 'provider, providerId and email are required' }, { status: 400 })
    }

    const db = prisma.user as any

    const providerWhere =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    let user = (await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } }))

    const providerData =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    if (user) {
      const alreadyLinked = user[`${provider}Id`]
      if (!alreadyLinked) {
        user = await db.update({ where: { id: user.id }, data: providerData })
      }
    } else {
      user = await db.create({ data: { name: name || email, email, ...providerData } })
    }

    return NextResponse.json({ user: safeUser(user), token: signToken(user.id, user.role) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
