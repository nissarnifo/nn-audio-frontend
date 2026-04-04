import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, apiError } from '@/lib/api-auth'

function safeUser(u: { id: string; name: string; email: string; phone?: string | null; role: string; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const { provider, providerId, email, name } = await req.json() as {
      provider: 'google' | 'github' | 'discord'
      providerId: string
      email: string
      name: string
    }

    if (!provider || !providerId || !email) {
      return NextResponse.json({ error: 'provider, providerId and email are required' }, { status: 400 })
    }

    const providerWhere =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    const providerData =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    const db = prisma.user as any
    let user = (await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } }))

    if (user) {
      if (!user[`${provider}Id`]) {
        user = await db.update({ where: { id: user.id }, data: providerData })
      }
    } else {
      user = await db.create({ data: { name: name || email, email, ...providerData } })
    }

    return NextResponse.json({ user: safeUser(user), token: signToken(user.id, user.role) })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
