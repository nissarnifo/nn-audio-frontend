export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-helpers'
import { validateBody, schemas } from '@/lib/validate'
import { limiters, getIp, rateLimitResponse } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  const rl = rateLimitResponse(limiters.auth(getIp(req.headers)))
  if (rl) return rl

  const { data, error } = await validateBody(req, schemas.login)
  if (error) return error

  try {
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    return NextResponse.json({ user: safeUser(user), token: signToken(user.id, user.role) })
  } catch (e) {
    console.error('[login]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
