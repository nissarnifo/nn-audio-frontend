import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-auth'

function safe(user: any) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const { provider, providerId, email, name } = await req.json() as {
      provider: 'google' | 'github' | 'discord'
      providerId: string
      email: string
      name: string
    }
    if (!provider || !providerId || !email)
      return Response.json({ error: 'provider, providerId and email are required' }, { status: 400 })

    const db = prisma.user as any
    const providerWhere =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }
    const providerData =
      provider === 'google' ? { googleId: providerId }
      : provider === 'github' ? { githubId: providerId }
      : { discordId: providerId }

    let user = (await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } }))
    if (user) {
      const alreadyLinked = user[`${provider}Id`]
      if (!alreadyLinked) user = await db.update({ where: { id: user.id }, data: providerData })
    } else {
      user = await db.create({ data: { name: name || email, email, ...providerData } })
    }

    return Response.json({ user: safe(user), token: signToken(user.id, user.role) })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
